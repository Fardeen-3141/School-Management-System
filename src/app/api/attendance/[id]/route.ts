// src\app\api\attendance\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

// GET single attendance record
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

    const attendance = await prisma.attendance.findUnique({
      where: {
        id,
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

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error: unknown) {
    console.error("Error fetching attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE attendance record
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const validatedData = updateAttendanceSchema.parse(data);

    const { id } = await context.params;

    const existingRecord = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id },
      data: {
        status: validatedData.status,
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

    return NextResponse.json(updatedAttendance);
  } catch (error: unknown) {
    console.error("Error updating attendance record:", error);
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

// DELETE attendance record
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

    const existingRecord = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
