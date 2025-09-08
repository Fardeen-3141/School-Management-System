// src\app\api\attendance\bulk\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const bulkAttendanceSchema = z.object({
  date: z.string(),
  attendanceData: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const validatedData = bulkAttendanceSchema.parse(data);

    if (validatedData.attendanceData.length === 0) {
      return NextResponse.json(
        { error: "No attendance data provided" },
        { status: 400 }
      );
    }

    // Verify all students exist
    const studentIds = validatedData.attendanceData.map(
      (item) => item.studentId
    );
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      select: {
        id: true,
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 404 }
      );
    }

    const attendanceDate = new Date(validatedData.date);

    // Get existing attendance records for the date and students
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        date: attendanceDate,
        studentId: { in: studentIds },
      },
    });

    const existingAttendanceMap = new Map(
      existingAttendance.map((record) => [record.studentId, record])
    );

    // Prepare bulk operations
    const createData: Prisma.AttendanceCreateManyInput[] = [];
    const updateOperations: ReturnType<typeof prisma.attendance.update>[] = [];

    for (const item of validatedData.attendanceData) {
      const existing = existingAttendanceMap.get(item.studentId);

      if (existing) {
        // Update existing record
        updateOperations.push(
          prisma.attendance.update({
            where: { id: existing.id },
            data: { status: item.status },
          })
        );
      } else {
        // Create new record
        createData.push({
          date: attendanceDate,
          status: item.status,
          studentId: item.studentId,
        });
      }
    }

    // Execute all operations in a transaction
    await prisma.$transaction([
      ...(createData.length > 0
        ? [prisma.attendance.createMany({ data: createData })]
        : []),
      ...updateOperations,
    ]);

    return NextResponse.json({
      message: "Bulk attendance recorded successfully",
      created: createData.length,
      updated: updateOperations.length,
      total: validatedData.attendanceData.length,
    });
  } catch (error: unknown) {
    console.error("Error creating bulk attendance:", error);
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
