-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_feeId_fkey";

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "feeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "public"."Fee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
