// src\app\api\fees\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateFeeSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string(),
});

// GET single fee
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const fee = await prisma.fee.findUnique({
      where: { id },
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
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    return NextResponse.json(fee);
  } catch (error: unknown) {
    console.error("Error fetching fee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE fee
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateFeeSchema.parse(body);

    const { id } = await context.params;

    // Check if fee exists
    const existingFee = await prisma.fee.findUnique({
      where: { id },
    });

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    const updatedFee = await prisma.fee.update({
      where: { id },
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
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
      },
    });

    return NextResponse.json(updatedFee);
  } catch (error: unknown) {
    console.error("Error updating fee:", error);
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

// DELETE fee
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if fee exists
    const existingFee = await prisma.fee.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    // Check if fee has payments
    if (existingFee.payments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete fee with existing payments. Please delete payments first.",
        },
        { status: 400 }
      );
    }

    await prisma.fee.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Fee deleted successfully" });
  } catch (error) {
    console.error("Error deleting fee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
