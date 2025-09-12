
"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/special/Logo";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="outline" className="cursor-pointer px-3 sm:px-4">
              <LogIn className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Portal Login</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
