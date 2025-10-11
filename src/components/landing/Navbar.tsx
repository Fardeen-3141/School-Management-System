"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/special/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card backdrop-blur-sm shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Avatar className="h-8 w-8 bg-background">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-card text-foreground">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </nav>
      </div>
    </header>
  );
}
