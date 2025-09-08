-- CreateEnum
CREATE TYPE "public"."Recurrence" AS ENUM ('ONCE', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "public"."Fee" ADD COLUMN     "studentFeeSetupId" TEXT;

-- CreateTable
CREATE TABLE "public"."FeeStructure" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "recurrence" "public"."Recurrence" NOT NULL DEFAULT 'ONCE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentFeeSetup" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "customAmount" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGeneratedFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeSetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_type_key" ON "public"."FeeStructure"("type");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeSetup_studentId_feeStructureId_key" ON "public"."StudentFeeSetup"("studentId", "feeStructureId");

-- AddForeignKey
ALTER TABLE "public"."StudentFeeSetup" ADD CONSTRAINT "StudentFeeSetup_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentFeeSetup" ADD CONSTRAINT "StudentFeeSetup_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fee" ADD CONSTRAINT "Fee_studentFeeSetupId_fkey" FOREIGN KEY ("studentFeeSetupId") REFERENCES "public"."StudentFeeSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
