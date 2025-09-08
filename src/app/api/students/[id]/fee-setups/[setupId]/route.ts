// src\app\api\students\[id]\fee-setups\[setupId]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStudentFeeSetupSchema = z.object({
  customAmount: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

// UPDATE a specific student fee setup
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; setupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateStudentFeeSetupSchema.parse(body);

    const { id, setupId } = await context.params;

    // Ensure the setup exists and belongs to the correct student
    const existingSetup = await prisma.studentFeeSetup.findFirst({
      where: {
        id: setupId,
        studentId: id,
      },
    });

    if (!existingSetup) {
      return NextResponse.json(
        { error: "Fee setup not found for this student." },
        { status: 404 }
      );
    }

    const updatedSetup = await prisma.studentFeeSetup.update({
      where: {
        id: setupId,
      },
      data: {
        customAmount: validatedData.customAmount,
        isActive: validatedData.isActive,
      },
      include: {
        feeStructure: true,
      },
    });

    return NextResponse.json(updatedSetup);
  } catch (error: unknown) {
    console.error("Error updating student fee setup:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error:", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE (remove) a fee structure from a student
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; setupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, setupId } = await context.params;

    // Ensure the setup exists and belongs to the correct student before deleting
    const existingSetup = await prisma.studentFeeSetup.findFirst({
      where: {
        id: setupId,
        studentId: id,
      },
    });

    if (!existingSetup) {
      return NextResponse.json(
        { error: "Fee setup not found for this student." },
        { status: 404 }
      );
    }

    await prisma.studentFeeSetup.delete({
      where: {
        id: setupId,
      },
    });

    return NextResponse.json({
      message: "Fee structure removed from student successfully.",
    });
  } catch (error) {
    console.error("Error removing fee structure from student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
