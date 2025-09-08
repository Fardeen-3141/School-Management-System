// src\app\admin\fees\page.tsx

import React from "react";
import AdminFeesPageClient from "./fees-client";

export default function AdminFeesPage() {
  return (
    <React.Suspense>
      <AdminFeesPageClient />
    </React.Suspense>
  );
}
