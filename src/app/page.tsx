// src\app\page.tsx

"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // Redirect based on role
      if (session.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } else {
      // Not signed in, redirect to login
      router.push("/auth/login");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}
