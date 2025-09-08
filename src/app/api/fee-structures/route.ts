// src\app\api\fee-structures\route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const feeStructureSchema = z.object({
  type: z.string().min(2, "Type must be at least 2 characters long"),
  amount: z.number().positive("Amount must be a positive number"),
  recurrence: z.enum(["ONCE", "MONTHLY", "YEARLY"]),
  isDefault: z.boolean().optional(),
});

// GET all fee structures
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feeStructures = await prisma.feeStructure.findMany({
      orderBy: {
        type: "asc",
      },
    });

    return NextResponse.json(feeStructures);
  } catch (error: unknown) {
    console.error("Error fetching fee structures:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE a new fee structure
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = feeStructureSchema.parse(body);

    // Check if a fee structure with this type already exists
    const existingStructure = await prisma.feeStructure.findUnique({
      where: {
        type: validatedData.type,
      },
    });

    if (existingStructure) {
      return NextResponse.json(
        {
          error: `Fee structure with type "${validatedData.type}" already exists`,
        },
        { status: 400 }
      );
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        recurrence: validatedData.recurrence,
        isDefault: validatedData.isDefault ?? false,
      },
    });

    return NextResponse.json(feeStructure, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating fee structure:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error:", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
