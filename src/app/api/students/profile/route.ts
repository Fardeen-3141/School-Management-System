// src\app\api\student\profile\route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        fees: {
          orderBy: {
            dueDate: "asc",
          },
        },
        payments: {
          orderBy: {
            date: "desc",
          },
        },
        attendance: {
          orderBy: {
            date: "desc",
          },
          take: 30,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: unknown) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
