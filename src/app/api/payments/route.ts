// src\app\api\payments\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  feeId: z.string().optional(),
  amount: z.number().min(0),
  discount: z.number().min(0).optional(),
  date: z.string(),
});

// GET all payments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: true,
            section: true,
          },
        },
        fee: {
          select: {
            id: true,
            type: true,
            amount: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Raw Body", body);
    const validatedData = createPaymentSchema.parse(body);
    const { studentId, feeId, amount, discount = 0, date } = validatedData;

    // A transaction must consist of either an amount or a discount.
    if (amount <= 0 && discount <= 0) {
      return NextResponse.json(
        { error: "Payment amount and discount cannot both be zero." },
        { status: 400 }
      );
    }

    const totalCredit = amount + discount;
    const paymentsToCreate: Prisma.PaymentCreateArgs[] = [];

    // --- SPECIFIC FEE PAYMENT ---
    if (feeId) {
      const fee = await prisma.fee.findFirst({
        where: {
          id: feeId,
          studentId: studentId,
        },
        include: {
          payments: true,
        },
      });

      if (!fee) {
        return NextResponse.json(
          { error: "Fee not found for this student" },
          { status: 404 }
        );
      }

      const totalPaid = fee.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const remaining = Number(fee.amount) - totalPaid;

      if (totalCredit > remaining + 0.01) {
        return NextResponse.json(
          {
            error: `Total credit (₹${totalCredit}) exceeds remaining fee amount (₹${remaining.toFixed(
              2
            )})`,
          },
          { status: 400 }
        );
      }

      if (amount > 0) {
        paymentsToCreate.push({
          data: {
            studentId,
            feeId,
            amount,
            date: new Date(date),
            type: "PAYMENT" as const,
          },
        });
      }
      if (discount > 0) {
        paymentsToCreate.push({
          data: {
            studentId,
            feeId,
            amount: discount,
            date: new Date(date),
            type: "DISCOUNT" as const,
          },
        });
      }
    }

    // --- GENERAL PAYMENT ALLOCATION ---
    else {
      const allFeesForStudent = await prisma.fee.findMany({
        where: { studentId: studentId },
        include: { payments: true },
        orderBy: { dueDate: "asc" },
      });

      const feesWithBalances = allFeesForStudent
        .map((fee) => {
          const totalPaid = fee.payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
          );
          return { ...fee, balance: Number(fee.amount) - totalPaid };
        })
        .filter((fee) => fee.balance > 0.01);

      const totalOutstandingBalance = feesWithBalances.reduce(
        (sum, fee) => sum + fee.balance,
        0
      );

      if (totalCredit > totalOutstandingBalance + 0.01) {
        return NextResponse.json(
          {
            error: `Total credit (₹${totalCredit}) exceeds total outstanding balance (₹${totalOutstandingBalance.toFixed(
              2
            )})`,
          },
          { status: 400 }
        );
      }

      let amountToAllocate = amount;
      let discountToAllocate = discount;

      for (const fee of feesWithBalances) {
        if (amountToAllocate <= 0 && discountToAllocate <= 0) break;

        let creditForThisFee = 0;

        // Allocate discount first
        if (discountToAllocate > 0) {
          const discountApplied = Math.min(discountToAllocate, fee.balance);
          if (discountApplied > 0) {
            paymentsToCreate.push({
              data: {
                studentId,
                feeId: fee.id,
                amount: discountApplied,
                date: new Date(date),
                type: "DISCOUNT" as const,
              },
            });
            creditForThisFee += discountApplied;
            discountToAllocate -= discountApplied;
          }
        }

        // Allocate actual payment
        if (amountToAllocate > 0) {
          const remainingBalanceOnFee = fee.balance - creditForThisFee;
          if (remainingBalanceOnFee > 0) {
            const amountApplied = Math.min(
              amountToAllocate,
              remainingBalanceOnFee
            );
            if (amountApplied > 0) {
              paymentsToCreate.push({
                data: {
                  studentId,
                  feeId: fee.id,
                  amount: amountApplied,
                  date: new Date(date),
                  type: "PAYMENT" as const,
                },
              });
              amountToAllocate -= amountApplied;
            }
          }
        }
      }
    }

    if (paymentsToCreate.length === 0) {
      return NextResponse.json({
        message:
          "No payment or discount was recorded. The student may have no outstanding balance.",
      });
    }

    const createdRecords = await prisma.$transaction(
      paymentsToCreate.map((p) => prisma.payment.create(p))
    );

    return NextResponse.json(
      {
        message: `Successfully recorded ${createdRecords.length} transaction(s).`,
        records: createdRecords,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
