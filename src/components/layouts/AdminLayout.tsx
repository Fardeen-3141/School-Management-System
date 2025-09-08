// src\components\layouts\AdminLayout.tsx

"use client";

import React from "react";
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
  Users,
  CreditCard,
  Receipt,
  Settings,
  UserCheck,
  Mail,
  LogOut,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Fees", href: "/admin/fees", icon: CreditCard },
    { name: "Payments", href: "/admin/payments", icon: Receipt },
    { name: "Fee Structures", href: "/admin/fee-structures", icon: Settings },
    { name: "Attendance", href: "/admin/attendance", icon: UserCheck },
    { name: "Invitations", href: "/admin/invitations", icon: Mail },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  // Mobile backdrop overlay
  const MobileBackdrop = () => (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden",
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={closeSidebar}
    />
  );

  // Navigation items component
  const NavigationItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex-1 space-y-1 px-3">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={mobile ? closeSidebar : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
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
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {session?.user?.name || "Admin User"}
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
        "flex h-full w-64 flex-col bg-card border-r border-border",
        mobile &&
          "fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out",
        mobile && (sidebarOpen ? "translate-x-0" : "-translate-x-full")
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-foreground">Admin Panel</span>
        </div>
        {mobile && (
          <Button
            onClick={closeSidebar}
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavigationItems mobile={mobile} />
      </div>

      {/* User section */}
      <UserSection mobile={mobile} />
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
          <div className="hidden sm:flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {session?.user?.name || session?.user?.email}
            </span>
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
