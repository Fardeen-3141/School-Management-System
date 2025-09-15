import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";
import { Decimal } from "@prisma/client/runtime/library";
import { Fee, Payment, Student } from "@prisma/client";

// Type for the data returned by the Prisma query
type StudentWithDetails = Student & {
  fees: (Fee & {
    payments: Payment[];
  })[];
};

// Type for a single row in the ledger
interface LedgerEntry {
  date: Date;
  description: string;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
}

// Type for the summary box data
interface LedgerSummary {
  totalDebit: Decimal;
  totalCredit: Decimal;
  balance: Decimal;
}

// Main function to handle the GET request
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // 1. Fetch Data
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        fees: {
          include: {
            payments: true,
          },
          orderBy: {
            dueDate: "asc", // Order by due date initially
          },
        },
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // 2. Process Data into a Ledger
    const ledgerEntries = processDataForLedger(student);
    const summary = calculateSummary(ledgerEntries);

    // 3. Generate HTML
    const htmlContent = generateLedgerHTML(student, ledgerEntries, summary);

    // 4. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        right: "40px",
        bottom: "40px",
        left: "40px",
      },
    });
    await browser.close();

    // 5. Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ledger-${student.rollNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}

// --- Data Processing ---

interface LedgerEntry {
  date: Date;
  description: string;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
}

function processDataForLedger(student: StudentWithDetails): LedgerEntry[] {
  type Transaction = {
    date: Date;
    type: "fee" | "payment";
    data: Fee | (Payment & { feeType: string });
  };

  const transactions: Transaction[] = [];

  student.fees.forEach((fee) => {
    transactions.push({ date: fee.dueDate, type: "fee", data: fee });
    fee.payments.forEach((payment) => {
      transactions.push({
        date: payment.date,
        type: "payment",
        data: { ...payment, feeType: fee.type },
      });
    });
  });

  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const ledgerEntries: LedgerEntry[] = [];
  let currentBalance = new Decimal(0);

  transactions.forEach((tx) => {
    if (tx.type === "fee") {
      const fee = tx.data as Fee;
      currentBalance = currentBalance.plus(fee.amount);
      ledgerEntries.push({
        date: fee.dueDate,
        description: `${fee.type}`,
        debit: fee.amount,
        credit: new Decimal(0),
        balance: currentBalance,
      });
    } else if (tx.type === "payment") {
      const payment = tx.data as Payment & { feeType: string };
      currentBalance = currentBalance.minus(payment.amount);
      ledgerEntries.push({
        date: payment.date,
        description:
          payment.type === "DISCOUNT"
            ? `Discount for ${payment.feeType}`
            : `Payment for ${payment.feeType}`,
        debit: new Decimal(0),
        credit: payment.amount,
        balance: currentBalance,
      });
    }
  });

  return ledgerEntries;
}

function calculateSummary(entries: LedgerEntry[]): LedgerSummary {
  const totalDebit = entries.reduce(
    (sum, entry) => sum.plus(entry.debit),
    new Decimal(0)
  );
  const totalCredit = entries.reduce(
    (sum, entry) => sum.plus(entry.credit),
    new Decimal(0)
  );
  const balance = totalDebit.minus(totalCredit);

  return { totalDebit, totalCredit, balance };
}

// --- HTML Generation ---

function generateLedgerHTML(
  student: StudentWithDetails,
  entries: LedgerEntry[],
  summary: LedgerSummary
): string {
  const formatDate = (date: Date) => new Date(date).toLocaleDateString("en-GB");
  const formatCurrency = (amount: Decimal) =>
    `₹${amount.toFixed(2).toLocaleString()}`;

  const tableRows = entries
    .map(
      (entry) => `
      <tr>
        <td>${formatDate(entry.date)}</td>
        <td>${entry.description}</td>
        <td class="text-right">${
          entry.debit.isZero()
            ? "-"
            : `<span class="text-debit">${formatCurrency(entry.debit)}</span>`
        }</td>
        <td class="text-right">${
          entry.credit.isZero()
            ? "-"
            : `<span class="text-credit">${formatCurrency(entry.credit)}</span>`
        }</td>
        <td class="text-right text-balance">${formatCurrency(
          entry.balance
        )}</td>
      </tr>
    `
    )
    .join("");

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student Ledger - ${student.name}</title>
         <style>
            html, body { height: 100%; }
            body {
              display: flex;
              flex-direction: column;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 12px;
              color: #333;
              margin: 0;
            }
            .container { flex: 1 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #111; }
            .header p { margin: 2px 0; font-size: 12px; color: #555; }
            .student-info { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; }
            .student-info table { width: 100%; }
            .student-info td { padding: 4px 0; }
            .student-info .label { font-weight: 600; color: #444; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
            .summary-item { text-align: center; }
            .summary-item .label { font-size: 12px; color: #555; text-transform: uppercase; }
            .summary-item .value { font-size: 18px; font-weight: 600; }
            .summary-item .value.debit { color: #c0392b; }
            .summary-item .value.credit { color: #27ae60; }
            .summary-item .value.balance { color: #2980b9; }
            table.ledger { width: 100%; border-collapse: collapse; }
            .ledger th, .ledger td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
            .ledger th { background-color: #f2f2f2; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #444; }
            .ledger tr:last-child td { border-bottom: none; }
            .ledger .text-right { text-align: right; }
            .text-debit { font-weight: 500; color: #c0392b; }
            .text-credit { font-weight: 500; color: #27ae60; }
            .text-balance { font-weight: 500; color: #2980b9; }
            .footer { flex-shrink: 0; padding: 20px; font-size: 10px; color: #888; }
            .signature-section { text-align: right; margin-bottom: 15px; }
            .signature-line {
                display: inline-block;
                width: 220px;
                border-top: 1px solid #555;
                padding-top: 8px;
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                color: #444;
            }
         </style>
      </head>
      <body>
      <div class="container">
        <div class="header">
          <h1>Anipur Adarsha Vidyaniketan HS</h1>
          <p>Anipur, P.O.-Anipur, Dist-Sribhumi(Karimganj), Assam, 788734</p>
          <p>Student Fee Ledger</p>
        </div>

        <div class="student-info">
          <table>
            <tr>
              <td class="label">Student Name:</td>
              <td>${student.name}</td>
              <td class="label">Class:</td>
              <td>${student.class}-${student.section}</td>
            </tr>
            <tr>
              <td class="label">Roll Number:</td>
              <td>${student.rollNumber}</td>
              <td class="label">Guardian:</td>
              <td>${student.guardian} (${student.guardianPhone})</td>
            </tr>
          </table>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="label">Total Fees</div>
            <div class="value debit">${formatCurrency(summary.totalDebit)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Paid</div>
            <div class="value credit">${formatCurrency(
              summary.totalCredit
            )}</div>
          </div>
          <div class="summary-item">
            <div class="label">Balance Due</div>
            <div class="value balance">${formatCurrency(summary.balance)}</div>
          </div>
        </div>

        <table class="ledger">
          <thead>
            <tr>
              <th>Due Date / Payment Date</th>
              <th>Description</th>
              <th class="text-right">Debit</th>
              <th class="text-right">Credit</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div class="signature-section">
            <div class="signature-line">
                Authorized Signature
            </div>
        </div>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
    `;
}
