// src\app\api\auth\register\admin\route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const adminRegistrationSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  employeeId: z.string().min(1),
  invitationCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = adminRegistrationSchema.parse(body);

    // Check if invitation code exists and is valid
    const invitation = await prisma.invitation.findUnique({
      where: {
        code: validatedData.invitationCode,
        email: validatedData.email,
        role: "ADMIN",
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

    // Check if employee ID is unique
    const existingEmployee = await prisma.user.findUnique({
      where: { employeeId: validatedData.employeeId },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        employeeId: validatedData.employeeId,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { isUsed: true },
    });

    return NextResponse.json(
      { message: "Admin registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Admin registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
