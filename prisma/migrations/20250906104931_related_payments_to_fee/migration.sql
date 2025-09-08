/*
  Warnings:

  - Made the column `feeId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_feeId_fkey";

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "feeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "public"."Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
