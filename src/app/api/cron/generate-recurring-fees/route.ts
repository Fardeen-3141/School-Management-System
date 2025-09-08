// cron/generate-recurring-fees/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Recurrence } from "@prisma/client";

export async function GET(req: NextRequest) {
  // 1. SECURE THE ENDPOINT
  // The Vercel Cron Job will send a secret token in the authorization header.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting recurring fee generation job...");
    const now = new Date();
    let feesGeneratedCount = 0;

    // 2. FIND ALL ACTIVE, RECURRING FEE SETUPS
    const activeSetups = await prisma.studentFeeSetup.findMany({
      where: {
        isActive: true,
        feeStructure: {
          recurrence: {
            in: [Recurrence.MONTHLY, Recurrence.YEARLY],
          },
        },
      },
      include: {
        feeStructure: true,
        student: true,
      },
    });

    console.log(
      `Found ${activeSetups.length} active recurring setups to process.`
    );

    // 3. PROCESS EACH SETUP
    for (const setup of activeSetups) {
      const { recurrence } = setup.feeStructure;
      const lastGenerated = setup.lastGeneratedFor;

      let shouldGenerate = false;

      // Get the beginning of the current period (month or year)
      const currentPeriodStart = new Date(
        now.getFullYear(),
        recurrence === "MONTHLY" ? now.getMonth() : 0,
        1
      );

      if (!lastGenerated) {
        // If a fee has never been generated, we should generate one.
        shouldGenerate = true;
      } else {
        // If it has been generated, check if the last generation was before the current period.
        const lastGeneratedPeriodStart = new Date(
          lastGenerated.getFullYear(),
          recurrence === "MONTHLY" ? lastGenerated.getMonth() : 0,
          1
        );
        if (lastGeneratedPeriodStart.getTime() < currentPeriodStart.getTime()) {
          shouldGenerate = true;
        }
      }

      // 4. GENERATE THE FEE IF NEEDED
      if (shouldGenerate) {
        console.log(
          `Generating ${recurrence} fee "${setup.feeStructure.type}" for student ${setup.student.name}`
        );

        const feeAmount = setup.customAmount ?? setup.feeStructure.amount;
        const feeType = setup.feeStructure.type;

        // Set the due date to the end of the current month
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Use a transaction to ensure both creating the fee and updating the setup succeed or fail together.
        await prisma.$transaction(async (tx) => {
          // Create the new fee record
          await tx.fee.create({
            data: {
              type: feeType,
              amount: feeAmount,
              dueDate: dueDate,
              studentId: setup.studentId,
              studentFeeSetupId: setup.id, // Link back to the setup
            },
          });

          // IMPORTANT: Update the 'lastGeneratedFor' timestamp to the current period
          await tx.studentFeeSetup.update({
            where: { id: setup.id },
            data: { lastGeneratedFor: currentPeriodStart },
          });
        });

        feesGeneratedCount++;
      }
    }

    const message = `Fee generation job completed. Generated ${feesGeneratedCount} new fees.`;
    console.log(message);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error during recurring fee generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
