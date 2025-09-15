import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { Decimal } from "@prisma/client/runtime/library";
import { PaymentType, Student } from "@prisma/client";

type StudentSummary = Student & {
  totalFees: Decimal;
  totalPaid: Decimal;
  totalDiscounted: Decimal;
  totalDue: Decimal;
};

interface SchoolSummary {
  totalFees: Decimal;
  totalPaid: Decimal;
  totalDue: Decimal;
}

// Main function to handle the GET request
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Fetch Data
    const students = await prisma.student.findMany({
      include: {
        fees: { select: { amount: true } },
        payments: { select: { amount: true, type: true } },
      },
    });

    // 2. Process and Sort Data
    const processedStudents: StudentSummary[] = students.map((student) => {
      const totalFees = student.fees.reduce(
        (sum, fee) => sum.plus(fee.amount),
        new Decimal(0)
      );
      const totalPaid = student.payments
        .filter((p) => p.type === PaymentType.PAYMENT)
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      const totalDiscounted = student.payments
        .filter((p) => p.type === PaymentType.DISCOUNT)
        .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
      const totalDue = totalFees.minus(totalPaid).minus(totalDiscounted);

      return {
        ...student,
        totalFees,
        totalPaid,
        totalDiscounted,
        totalDue,
      };
    });

    const sortedStudents = customSortStudents(processedStudents);

    const schoolSummary = processedStudents.reduce(
      (acc, student) => {
        acc.totalFees = acc.totalFees.plus(student.totalFees);
        acc.totalPaid = acc.totalPaid.plus(student.totalPaid);
        return acc;
      },
      {
        totalFees: new Decimal(0),
        totalPaid: new Decimal(0),
      }
    );
    const totalDue = schoolSummary.totalFees.minus(schoolSummary.totalPaid);

    // 3. Generate HTML
    const htmlContent = generateAllStudentsHTML(sortedStudents, {
      ...schoolSummary,
      totalDue,
    });
    const footerTemplate = `
        <div style="font-size: 8px; text-align: center; width: 100%; color: #777;">
          Generated on ${new Date().toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })} | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `;

    // 4. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: footerTemplate,
      margin: {
        top: "50px",
        right: "40px",
        bottom: "50px",
        left: "40px",
      },
    });
    await browser.close();

    // 5. Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="all-students-summary.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating global PDF:", error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}

// --- Data Processing & Sorting ---

const classOrder = [
  "PP-1",
  "PP-2",
  "Class-1",
  "Class-2",
  "Class-3",
  "Class-4",
  "Class-5",
  "Class-6",
  "Class-7",
  "Class-8",
  "Class-9",
  "Class-10",
  "Class-11 (HS)",
  "Class-12 (HS)",
];

function customSortStudents(students: StudentSummary[]): StudentSummary[] {
  return students.sort((a, b) => {
    const classAIndex = classOrder.indexOf(a.class);
    const classBIndex = classOrder.indexOf(b.class);

    if (classAIndex !== classBIndex) {
      return classAIndex - classBIndex;
    }

    // If classes are the same, sort by roll number (numeric comparison)
    const rollA = parseInt(a.rollNumber, 10);
    const rollB = parseInt(b.rollNumber, 10);
    return rollA - rollB;
  });
}

// --- HTML Generation ---

function generateAllStudentsHTML(
  students: StudentSummary[],
  summary: SchoolSummary
): string {
  const formatCurrency = (amount: Decimal) =>
    `₹${amount.toFixed(2).toLocaleString()}`;

  const tableRows = students
    .map(
      (student) => `
      <tr>
        <td>
          <div class="student-name">${student.name}</div>
          <div class="student-details">Class ${student.class}-${
        student.section
      } | Roll: ${student.rollNumber}</div>
        </td>
        <td class="text-right">${formatCurrency(student.totalFees)}</td>
        <td class="text-right text-green">${formatCurrency(
          student.totalPaid
        )}</td>
        <td class="text-right text-purple">${formatCurrency(
          student.totalDiscounted
        )}</td>
        <td class="text-right text-red">${formatCurrency(student.totalDue)}</td>
      </tr>
    `
    )
    .join("");

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>All Students Fee Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, san-serif; margin: 0; padding: 0; font-size: 11px; color: #333; }
          .header { text-align: center; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 22px; color: #111; }
          .header p { margin: 2px 0; font-size: 11px; color: #555; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 25px; padding: 15px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
          .summary-item { text-align: center; }
          .summary-item .label { font-size: 11px; color: #555; text-transform: uppercase; }
          .summary-item .value { font-size: 16px; font-weight: 600; }
          .summary-item .value.debit { color: #c0392b; }
          .summary-item .value.credit { color: #27ae60; }
          .summary-item .value.balance { color: #2980b9; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 9px; border-bottom: 1px solid #eee; text-align: left; }
          th { background-color: #f2f2f2; font-weight: 600; font-size: 10px; text-transform: uppercase; color: #444;}
          tr:last-child td { border-bottom: none; }
          .text-right { text-align: right; }
          .student-name { font-weight: 500; }
          .student-details { font-size: 10px; color: #666; }
          .text-red { color: #c0392b; }
          .text-green { color: #27ae60; }
          .text-purple { color: #8e44ad; }
          .signature-section { page-break-before: auto; text-align: right; margin-top: 80px; padding-top: 20px; }
          .signature-line { display: inline-block; width: 220px; border-top: 1px solid #555; padding-top: 8px; text-align: center; font-size: 12px; font-weight: 600; color: #444; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Anipur Adarsha Vidyaniketan HS</h1>
          <p>Anipur, P.O.-Anipur, Dist-Sribhumi(Karimganj), Assam, 788734</p>
          <p>All Students Fee Summary</p>
        </div>
        <div class="summary">
          <div class="summary-item">
            <div class="label">Overall School Fees</div>
            <div class="value debit">${formatCurrency(summary.totalFees)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Overall Paid</div>
            <div class="value credit">${formatCurrency(summary.totalPaid)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Overall Balance Due</div>
            <div class="value balance">${formatCurrency(summary.totalDue)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Info</th>
              <th class="text-right">Total Fees</th>
              <th class="text-right">Total Paid</th>
              <th class="text-right">Total Discounted</th>
              <th class="text-right">Total Due</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="signature-section">
          <div class="signature-line">
              Authorized Signature
          </div>
        </div>
      </body>
      </html>
    `;
}
