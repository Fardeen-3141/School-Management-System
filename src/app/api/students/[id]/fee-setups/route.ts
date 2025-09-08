// src\app\api\students\[id]\fee-setups\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createStudentFeeSetupSchema = z.object({
  feeStructureId: z.cuid(),
  customAmount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET all fee setups for a specific student
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

    const studentFeeSetups = await prisma.studentFeeSetup.findMany({
      where: {
        studentId: id,
      },
      include: {
        feeStructure: true,
      },
      orderBy: {
        feeStructure: {
          type: "asc",
        },
      },
    });

    return NextResponse.json(studentFeeSetups);
  } catch (error: unknown) {
    console.error("Error fetching student fee setups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST (apply) a new fee structure to a student
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createStudentFeeSetupSchema.parse(body);

    const { id } = await context.params;

    // Check if the student and fee structure exist
    const student = await prisma.student.findUnique({
      where: { id },
    });
    const feeStructure = await prisma.feeStructure.findUnique({
      where: {
        id: validatedData.feeStructureId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!feeStructure) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }

    // Check if this fee setup already exists for the student
    const existingSetup = await prisma.studentFeeSetup.findUnique({
      where: {
        studentId_feeStructureId: {
          studentId: id,
          feeStructureId: validatedData.feeStructureId,
        },
      },
    });

    if (existingSetup) {
      return NextResponse.json(
        { error: "This fee structure is already applied to this student." },
        { status: 400 }
      );
    }

    const newSetup = await prisma.studentFeeSetup.create({
      data: {
        studentId: id,
        feeStructureId: validatedData.feeStructureId,
        customAmount: validatedData.customAmount,
        isActive: validatedData.isActive ?? true,
      },
      include: {
        feeStructure: true,
      },
    });

    return NextResponse.json(newSetup, { status: 201 });
  } catch (error: unknown) {
    console.error("Error applying fee structure:", error);
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
