import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const proxy = withAuth(
  function proxy(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (
      token?.accountStatus === "banned" &&
      pathname !== "/account-suspended" &&
      !pathname.startsWith("/api/auth")
    ) {
      if (pathname.startsWith("/api")) {
        if (pathname.startsWith("/api/appeals")) {
          return NextResponse.next();
        }

        return NextResponse.json(
          { message: "Account suspended." },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL("/account-suspended", req.url));
    }

    if (pathname.startsWith("/admin") && String(token?.role || "").toUpperCase() !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/dashboard") && String(token?.role || "").toUpperCase() === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        if (
          req.nextUrl.pathname.startsWith("/dashboard") ||
          req.nextUrl.pathname.startsWith("/admin")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
