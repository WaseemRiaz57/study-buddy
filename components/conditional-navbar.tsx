"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  if (!pathname) {
    return <Navbar />;
  }

  // Hide global marketing navbar on app routes (dashboard & admin)
  // "/" renders its own navigation (components/landing/LandingNav).
  const isHidden =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/register");

  if (isHidden) {
    return null; 
  }

  // Baqi poori app (Homepage, Dashboard) par Navbar show hoga
  return <Navbar />;
}
