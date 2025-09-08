// src\app\api\invitations\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";

const createInvitationSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "STUDENT"]),
  studentData: z
    .object({
      class: z.string().optional(),
      section: z.string().optional(),
      guardian: z.string().optional(),
      guardianEmail: z.email().optional(),
    })
    .optional(),
});

// Generate random invitation code
function generateInvitationCode(): string {
  return randomBytes(16).toString("hex").toUpperCase();
}

// CREATE invitation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createInvitationSchema.parse(body);

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

    // Check for existing unused invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: validatedData.email,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: validatedData.email,
        role: validatedData.role,
        code: generateInvitationCode(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy: session.user.id,
        studentData: validatedData.studentData ?? {},
      },
    });

    // Here you would typically send an email with the invitation code
    // For now, we'll return it in the response (remove in production)
    return NextResponse.json(
      {
        message: "Invitation created successfully",
        invitation: {
          email: invitation.email,
          code: invitation.code,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET invitations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        invitedUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invitations);
  } catch (error: unknown) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
