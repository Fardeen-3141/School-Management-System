// src\components\layouts\StudentLayout.tsx

"use client";

import React from "react";
import { ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  Receipt,
  UserCheck,
  LogOut,
  GraduationCap,
} from "lucide-react";

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Fees", href: "/student/fees", icon: CreditCard },
    { name: "Payments", href: "/student/payments", icon: Receipt },
    { name: "Attendance", href: "/student/attendance", icon: UserCheck },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  // Mobile backdrop overlay
  const MobileBackdrop = () => (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-black/50 transition-all duration-300 ease-in-out lg:hidden",
        sidebarOpen
          ? "opacity-100 backdrop-blur-sm"
          : "opacity-0 pointer-events-none"
      )}
      onClick={closeSidebar}
    />
  );

  // Navigation items component
  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex-1 space-y-1 px-3">
      {navigation.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={mobile ? closeSidebar : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
              mobile && sidebarOpen && "animate-in slide-in-from-left-2",
              mobile && sidebarOpen && `delay-${100 + index * 50}`
            )}
            style={
              mobile && sidebarOpen
                ? {
                    animationDelay: `${100 + index * 50}ms`,
                    animationDuration: "300ms",
                    animationFillMode: "both",
                  }
                : {}
            }
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  // User section component
  const UserSection = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "S"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {session?.user?.name || "Student"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {session?.user?.email}
          </p>
        </div>
      </div>
      <Button
        onClick={() => signOut()}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );

  // Sidebar component
  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-card border-r border-border shadow-2xl",
        mobile &&
          "fixed left-0 top-0 z-40 transform transition-all duration-300 ease-out",
        mobile &&
          (sidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-75 scale-95")
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-border px-4 transition-all duration-200",
          mobile && sidebarOpen && "delay-75"
        )}
      >
        <div className="flex items-center gap-2 font-semibold">
          <div
            className={cn(
              "h-8 w-8 rounded bg-primary flex items-center justify-center transition-transform duration-200",
              mobile && sidebarOpen && "delay-100 scale-110"
            )}
          >
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span
            className={cn(
              "text-foreground transition-all duration-200",
              mobile && sidebarOpen && "delay-150"
            )}
          >
            Student Portal
          </span>
        </div>
        {mobile && (
          <Button
            onClick={closeSidebar}
            variant="ghost"
            size="sm"
            className={cn(
              "ml-auto h-8 w-8 p-0 transition-all duration-200 hover:bg-accent/50",
              mobile && sidebarOpen && "delay-200"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div
        className={cn(
          "flex-1 overflow-y-auto py-4 transition-all duration-300",
          mobile && sidebarOpen && "delay-100"
        )}
      >
        <NavigationItems mobile={mobile} />
      </div>

      {/* User section */}
      <div
        className={cn(
          "transition-all duration-300",
          mobile && sidebarOpen && "delay-200"
        )}
      >
        <UserSection mobile={mobile} />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile backdrop */}
      <MobileBackdrop />

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar mobile />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="lg:hidden transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              School Fee Management System
            </h1>
          </div>

          {/* Desktop user info */}
          <div className="hidden sm:flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || "S"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button onClick={() => signOut()} variant="outline" size="sm">
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
