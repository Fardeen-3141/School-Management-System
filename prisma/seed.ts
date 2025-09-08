// prisma\seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create super admin user
  const hashedPassword = await bcrypt.hash("Fardeen@@299792458", 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: "fardeenakbar29@gmail.com",
      name: "Super Admin",
      role: "ADMIN",
      hashedPassword,
      employeeId: "SA001",
      status: "ACTIVE",
    },
  });

  console.log("Super admin created:", superAdmin.email);

  // Create a sample invitation for testing
  const invitation = await prisma.invitation.create({
    data: {
      email: "newadmin@school.com",
      role: "ADMIN",
      code: "ADMIN-INVITE-001",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: superAdmin.id,
    },
  });

  console.log("Sample admin invitation created:", invitation.code);

  // Create a sample student invitation
  const studentInvitation = await prisma.invitation.create({
    data: {
      email: "student@school.com",
      role: "STUDENT",
      code: "STUDENT-INVITE-001",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: superAdmin.id,
      studentData: {
        class: "10th",
        section: "A",
        guardian: "John Doe Sr.",
        guardianEmail: "parent@school.com",
      },
    },
  });

  console.log("Sample student invitation created:", studentInvitation.code);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
