// src\app\api\auth\register\student\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const studentRegistrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  invitationCode: z.string().min(1),
  rollNumber: z.string().min(1),
  guardianPhone: z.string().min(10),
});

interface StudentData {
  class: string;
  section: string;
  guardian: string;
  guardianEmail: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = studentRegistrationSchema.parse(body);

    // Check invitation
    const invitation = await prisma.invitation.findUnique({
      where: {
        code: validatedData.invitationCode,
        email: validatedData.email,
        role: "STUDENT",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation code" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Get student data from invitation
    const studentData = invitation.studentData as unknown as StudentData;

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          hashedPassword,
          studentId: validatedData.rollNumber,
          role: "STUDENT",
          status: "ACTIVE",
        },
      });

      const student = await tx.student.create({
        data: {
          name: validatedData.name,
          class: studentData?.class || "",
          section: studentData?.section || "",
          rollNumber: validatedData.rollNumber,
          guardian: studentData?.guardian || "",
          guardianPhone: validatedData.guardianPhone,
          guardianEmail: studentData?.guardianEmail || "",
          userId: user.id,
        },
      });

      // Mark invitation as used
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      return { user, student };
    });

    return NextResponse.json(
      { message: "Student registered successfully", userId: result.user.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
