
"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/special/Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Anipur Adarsha Vidyaniketan HS. All Rights Reserved.
            </p>
            <div className="mt-2 flex items-center justify-center md:justify-end gap-4 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
