// src\app\api\attendance\stats\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const classFilter = searchParams.get("class");
    const sectionFilter = searchParams.get("section");

    const whereClause: Prisma.AttendanceWhereInput = {};

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
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
            class: true,
            section: true,
          },
        },
      },
    });

    const stats = {
      totalRecords: attendance.length,
      present: attendance.filter((record) => record.status === "PRESENT")
        .length,
      absent: attendance.filter((record) => record.status === "ABSENT").length,
      late: attendance.filter((record) => record.status === "LATE").length,
      attendanceRate:
        attendance.length > 0
          ? Math.round(
              (attendance.filter((record) => record.status === "PRESENT")
                .length /
                attendance.length) *
                100
            )
          : 0,
    };

    type ClasswiseStats = {
      [key: string]: {
        present: number;
        absent: number;
        late: number;
        total: number;
      };
    };

    // Class-wise breakdown
    const classwiseStats = attendance.reduce<ClasswiseStats>((acc, record) => {
      const key = `${record.student.class}-${record.student.section}`;
      if (!acc[key]) {
        acc[key] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[key][record.status.toLowerCase() as "present" | "absent" | "late"]++;
      acc[key].total++;
      return acc;
    }, {});

    return NextResponse.json({
      overall: stats,
      classwise: classwiseStats,
    });
  } catch (error: unknown) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
