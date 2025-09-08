// src\app\auth\register\admin\page.tsx

import React from "react";
import AdminRegistrationPageClient from "./admin-register-client";

export default function AdminRegistrationPage() {
  return (
    <React.Suspense>
      <AdminRegistrationPageClient />
    </React.Suspense>
  );
}
