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

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // If feeId is provided, verify the fee exists and belongs to the student
    let fee: any = null;
    if (validatedData.feeId) {
      fee = await prisma.fee.findFirst({
        where: {
          id: validatedData.feeId,
          studentId: validatedData.studentId,
        },
      });

      if (!fee) {
        return NextResponse.json(
          { error: "Fee not found or doesn't belong to the specified student" },
          { status: 404 }
        );
      }

      // Check if payment amount doesn't exceed remaining fee amount
      const existingPayments = await prisma.payment.findMany({
        where: {
          studentId: validatedData.studentId,
          feeId: validatedData.feeId, // only payments for this fee
          status: "COMPLETED",
        },
      });

      const totalPaid = existingPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const remaining = Number(fee.amount) - totalPaid;

      if (validatedData.amount > remaining) {
        return NextResponse.json(
          {
            error: `Payment amount (₹${validatedData.amount}) exceeds remaining fee amount (₹${remaining})`,
          },
          { status: 400 }
        );
      }
    }

    const payment = await prisma.payment.create({
      data: {
        amount: validatedData.amount,
        method: validatedData.method,
        status: validatedData.status,
        date: new Date(validatedData.date),
        studentId: validatedData.studentId,
        feeId: validatedData.feeId ?? "general",
      },
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
    });

    return NextResponse.json(payment, { status: 201 });
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
