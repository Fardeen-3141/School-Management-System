// src\middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow registration pages without authentication
    if (pathname.startsWith("/auth/register")) {
      return NextResponse.next();
    }

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Student routes protection
    if (pathname.startsWith("/student")) {
      if (!token || token.role !== "STUDENT") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to auth pages
        if (pathname.startsWith("/auth")) {
          return true;
        }

        // Require token for protected routes
        if (pathname.startsWith("/admin") || pathname.startsWith("/student")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/auth/:path*"],
};
