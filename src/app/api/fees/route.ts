// src\app\api\fees\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFeeSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string(),
  studentId: z.string().optional(),
  applyToClass: z.boolean().optional(),
  targetClass: z.string().optional(),
  targetSection: z.string().optional(),
});

// GET all fees
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fees = await prisma.fee.findMany({
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
          select: {
            id: true,
            amount: true,
            status: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(fees);
  } catch (error: unknown) {
    console.error("Error fetching fees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE fee(s)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createFeeSchema.parse(body);

    if (validatedData.applyToClass) {
      // Create fees for all students in the specified class
      if (!validatedData.targetClass) {
        return NextResponse.json(
          { error: "Target class is required when applying to class" },
          { status: 400 }
        );
      }

      // Find students in the target class
      const whereClause: any = {
        class: validatedData.targetClass,
        user: {
          status: "ACTIVE", // Only create fees for active students
        },
      };

      if (validatedData.targetSection) {
        whereClause.section = validatedData.targetSection;
      }

      const targetStudents = await prisma.student.findMany({
        where: whereClause,
        select: { id: true },
      });

      if (targetStudents.length === 0) {
        return NextResponse.json(
          { error: "No active students found in the specified class/section" },
          { status: 400 }
        );
      }

      // Create fees for all students in transaction
      const createdFees = await prisma.$transaction(
        targetStudents.map((student) =>
          prisma.fee.create({
            data: {
              type: validatedData.type,
              amount: validatedData.amount,
              dueDate: new Date(validatedData.dueDate),
              studentId: student.id,
            },
          })
        )
      );

      return NextResponse.json(
        {
          message: `Fees created for ${createdFees.length} students`,
          count: createdFees.length,
        },
        { status: 201 }
      );
    } else {
      // Create fee for single student
      if (!validatedData.studentId) {
        return NextResponse.json(
          { error: "Student ID is required" },
          { status: 400 }
        );
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: validatedData.studentId },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      const fee = await prisma.fee.create({
        data: {
          type: validatedData.type,
          amount: validatedData.amount,
          dueDate: new Date(validatedData.dueDate),
          studentId: validatedData.studentId,
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

      return NextResponse.json(fee, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error creating fee:", error);
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
