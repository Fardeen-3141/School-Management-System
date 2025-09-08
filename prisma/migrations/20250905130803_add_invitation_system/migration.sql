/*
  Warnings:

  - You are about to drop the column `contact` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rollNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guardianPhone` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rollNumber` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "contact",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "admissionDate" TIMESTAMP(3),
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "guardianEmail" TEXT,
ADD COLUMN     "guardianPhone" TEXT NOT NULL,
ADD COLUMN     "rollNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "studentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "studentData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_key" ON "public"."Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "public"."Invitation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "public"."Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "public"."User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "public"."User"("studentId");

-- AddForeignKey
ALTER TABLE "public"."Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
