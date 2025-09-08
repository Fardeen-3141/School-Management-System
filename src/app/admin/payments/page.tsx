// src\app\admin\payments\page.tsx

import React from "react";
import AdminPaymentsPageClient from "./payments-client";

export default function AdminPaymentsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AdminPaymentsPageClient />
    </React.Suspense>
  );
}
