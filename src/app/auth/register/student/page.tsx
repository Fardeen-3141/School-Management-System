// src\app\auth\register\student\page.tsx

import React from "react";
import StudentRegistrationPageClient from "./student-register-client";

export default function StudentRegistrationPage() {
  return (
    <React.Suspense>
      <StudentRegistrationPageClient />
    </React.Suspense>
  );
}
