-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "feeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "public"."Fee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
