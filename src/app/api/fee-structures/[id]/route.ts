// src\app\api\fee-structures\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateFeeStructureSchema = z.object({
  type: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  recurrence: z.enum(["ONCE", "MONTHLY", "YEARLY"]).optional(),
  isDefault: z.boolean().optional(),
});

// UPDATE a fee structure
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
    const validatedData = updateFeeStructureSchema.parse(body);

    const { id } = await context.params;

    // If type is being changed, ensure it's not taken by another structure
    if (validatedData.type) {
      const existingStructure = await prisma.feeStructure.findFirst({
        where: {
          type: validatedData.type,
          id: { not: id },
        },
      });
      if (existingStructure) {
        return NextResponse.json(
          {
            error: `Fee structure with type "${validatedData.type}" already exists`,
          },
          { status: 400 }
        );
      }
    }

    const updatedFeeStructure = await prisma.feeStructure.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedFeeStructure);
  } catch (error: unknown) {
    console.error("Error updating fee structure:", error);
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

// DELETE a fee structure
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

    // Before deleting, check if this structure is being used by any students
    const studentSetups = await prisma.studentFeeSetup.count({
      where: { feeStructureId: id },
    });

    if (studentSetups > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete. This fee structure is currently applied to ${studentSetups} student(s). Please remove it from all students before deleting.`,
        },
        { status: 400 }
      );
    }

    await prisma.feeStructure.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
