/*
  Warnings:

  - You are about to drop the column `discount` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('PAYMENT', 'DISCOUNT');

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "discount",
ADD COLUMN     "type" "public"."PaymentType" NOT NULL DEFAULT 'PAYMENT';
