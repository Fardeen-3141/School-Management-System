// src\app\api\payments\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  feeId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "UPI"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
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
    const validatedData = createPaymentSchema.parse(body);
    const { studentId, feeId, amount, method, status, date } = validatedData;

    // --- SPECIFIC FEE PAYMENT ---
    if (feeId) {
      const fee = await prisma.fee.findFirst({
        where: { id: feeId, studentId: studentId },
        include: { payments: { where: { status: "COMPLETED" } } },
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

      if (amount > remaining) {
        return NextResponse.json(
          {
            error: `Payment amount (₹${amount}) exceeds remaining fee amount (₹${remaining.toFixed(
              2
            )})`,
          },
          { status: 400 }
        );
      }

      const payment = await prisma.payment.create({
        data: {
          studentId,
          feeId,
          amount,
          method,
          status,
          date: new Date(date),
        },
      });

      return NextResponse.json(payment, { status: 201 });
    }

    // --- GENERAL PAYMENT ALLOCATION ---
    let amountToAllocate = amount;

    // 1. Fetch all fees for the student that are not fully paid, oldest first.
    const allFeesForStudent = await prisma.fee.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        payments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
      orderBy: {
        dueDate: "asc", // Oldest debts first
      },
    });

    const feesWithBalances = allFeesForStudent
      .map((fee) => {
        const totalPaid = fee.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );

        return {
          ...fee,
          balance: Number(fee.amount) - totalPaid,
        };
      })
      .filter((fee) => fee.balance > 0.01); // Filter out fully paid fees

    const totalOutstandingBalance = feesWithBalances.reduce(
      (sum, fee) => sum + fee.balance,
      0
    );

    // Perform the critical overpayment check with the correct balance.
    if (amount > totalOutstandingBalance + 0.01) {
      return NextResponse.json(
        {
          error: `Payment amount (₹${amount}) exceeds total outstanding balance (₹${totalOutstandingBalance.toFixed(
            2
          )})`,
        },
        { status: 400 }
      );
    }

    // Allocating the payment to different fees
    const paymentCreationPromises = [];

    for (const fee of feesWithBalances) {
      if (amountToAllocate <= 0) break;

      const amountToApply = Math.min(amountToAllocate, fee.balance);

      paymentCreationPromises.push(
        prisma.payment.create({
          data: {
            studentId,
            feeId: fee.id,
            amount: amountToApply,
            method,
            status,
            date: new Date(date),
          },
        })
      );

      amountToAllocate -= amountToApply;
    }

    if (paymentCreationPromises.length === 0) {
      return NextResponse.json({ message: "No outstanding fees to pay." });
    }

    // Execute all payment creations in a single transaction
    const createdPayments = await prisma.$transaction(paymentCreationPromises);

    return NextResponse.json(
      {
        message: `Successfully allocated payment to ${createdPayments.length} fee(s).`,
        payments: createdPayments,
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
