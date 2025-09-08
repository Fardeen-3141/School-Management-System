// src\app\api\student\[id]\status\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    const { id } = await context.params;

    // Find student and update user status
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: student.userId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: "Status updated successfully",
      status: updatedUser.status,
    });
  } catch (error: unknown) {
    console.error("Error updating student status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
