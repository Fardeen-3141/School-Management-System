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
import Logo from "../ui/special/Logo";
import ThemeToggle from "../ui/special/ThemeSwitch";

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
              "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-card-foreground hover:bg-accent hover:text-accent-foreground"
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
  const UserSection = () => (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback className="bg-background text-foreground">
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
        className="w-full p-6 justify-start gap-2 cursor-pointer border-none"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      {/* Mobile sidebar - always rendered for animation */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 flex flex-col bg-card lg:hidden transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-20 items-center gap-2 px-2 md:px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-foreground">Admin Panel</span>
          </div>
          <Button
            onClick={closeSidebar}
            variant="ghost"
            size="sm"
            className="ml-auto h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavigationItems mobile={true} />
        </div>

        {/* Bottom section */}
        <div className="mt-auto">
          <ThemeToggle />
          <UserSection />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-full w-64 flex-col bg-card">
        {/* Header */}
        <div className="flex h-20 items-center gap-2 px-2 md:px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-foreground">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavigationItems mobile={false} />
        </div>

        {/* Bottom section */}
        <div className="mt-auto">
          <ThemeToggle />
          <UserSection />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-card">
        {/* Top bar */}
        <header className="flex h-20 items-center gap-4 bg-card px-6">
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
            <Logo />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:rounded-xl">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}