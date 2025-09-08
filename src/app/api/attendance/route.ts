// src\app\api\attendance\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAttendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

// GET all attendance records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");
    const classFilter = searchParams.get("classFilter");
    const sectionFilter = searchParams.get("sectionFilter");

    let whereClause: any;

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      whereClause.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (classFilter || sectionFilter) {
      whereClause.student = {};
      if (classFilter) whereClause.student.class = classFilter;
      if (sectionFilter) whereClause.student.section = sectionFilter;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
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
      orderBy: [{ date: "desc" }, { student: { rollNumber: "asc" } }],
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE or UPDATE single attendance record
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const validatedData = createAttendanceSchema.parse(data);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: {
        id: validatedData.studentId,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not Found" }, { status: 404 });
    }

    const attendanceDate = new Date(validatedData.date);

    // Check if the attendance extists
    const existingAttendence = await prisma.attendance.findUnique({
      where: {
        date_studentId: {
          studentId: validatedData.studentId,
          date: attendanceDate,
        },
      },
    });

    let attendance;
    if (existingAttendence) {
      // Update existing attendance
      attendance = await prisma.attendance.update({
        where: {
          id: existingAttendence.id,
        },
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
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          date: attendanceDate,
          status: validatedData.status,
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
    }

    return NextResponse.json(attendance, {
      status: existingAttendence ? 200 : 201,
    });
  } catch (error: unknown) {
    console.error("Error creating/updating attendance:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
