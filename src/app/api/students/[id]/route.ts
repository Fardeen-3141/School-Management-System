// src\app\api\student\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStudentSchema = z.object({
  name: z.string().min(1),
  class: z.string().min(1),
  section: z.string().min(1),
  rollNumber: z.string().min(1),
  guardian: z.string().min(1),
  guardianPhone: z.string().min(1),
  guardianEmail: z.email().nullable().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().nullable().optional(),
});

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

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            studentId: true,
          },
        },
        fees: {
          include: {
            payments: true,
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
          orderBy: { createdAt: "desc" },
        },
        payments: {
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
            fee: true,
          },
          orderBy: { createdAt: "desc" },
        },
        attendance: {
          take: 50,
          orderBy: { date: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: unknown) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validatedData = updateStudentSchema.parse(body);

    const { id } = await context.params;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update student in transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name: validatedData.name,
        },
      });

      // Update student
      const student = await tx.student.update({
        where: { id },
        data: {
          name: validatedData.name,
          class: validatedData.class,
          section: validatedData.section,
          rollNumber: validatedData.rollNumber,
          guardian: validatedData.guardian,
          guardianPhone: validatedData.guardianPhone,
          guardianEmail: validatedData.guardianEmail,
          address: validatedData.address,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              status: true,
              studentId: true,
            },
          },
        },
      });

      return student;
    });

    return NextResponse.json(updatedStudent);
  } catch (error: unknown) {
    console.error("Error updating student:", error);
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

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete student and related user in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all related records first
      await tx.attendance.deleteMany({
        where: {
          studentId: id,
        },
      });
      await tx.payment.deleteMany({
        where: {
          studentId: id,
        },
      });
      await tx.fee.deleteMany({
        where: {
          studentId: id,
        },
      });

      // Delete student
      await tx.student.delete({
        where: {
          id: id,
        },
      });

      // Delete user
      await tx.user.delete({
        where: {
          id: existingStudent.userId,
        },
      });
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
