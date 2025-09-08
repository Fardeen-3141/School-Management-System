// src\app\api\students\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createStudentSchema = z.object({
  name: z.string().min(1),
  class: z.string().min(1),
  section: z.string().min(1),
  rollNumber: z.string().min(1),
  guardian: z.string().min(1),
  guardianPhone: z.string().min(1),
  guardianEmail: z.string().email().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6).optional(), // Optional for admin-created students
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            status: true,
            studentId: true,
          },
        },
        fees: {
          include: {
            payments: true,
          },
        },
        payments: true,
        attendance: {
          take: 30,
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    return NextResponse.json(students);
  } catch (error: unknown) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createStudentSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if roll number is unique
    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber: validatedData.rollNumber },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this roll number already exists" },
        { status: 400 }
      );
    }

    // Generate default password if not provided
    const defaultPassword =
      validatedData.password || `student${validatedData.rollNumber}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          role: "STUDENT",
          status: "ACTIVE",
          studentId: validatedData.rollNumber,
          hashedPassword,
        },
      });

      const student = await tx.student.create({
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
          admissionDate: new Date(),
          userId: user.id,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
              status: true,
              studentId: true,
            },
          },
        },
      });

      return { user, student };
    });

    // Return student data without sensitive information
    const responseData = {
      ...result.student,
      defaultPassword: !validatedData.password ? defaultPassword : undefined,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating student:", error);

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
