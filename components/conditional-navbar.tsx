"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  if (!pathname) {
    return <Navbar />;
  }

  // 🚨 Dekhein: Yahan se maine "/dashboard" nikal diya hai
  // Ab Navbar sirf Admin aur Auth pages par hide hoga
  const isHidden = 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/register");

  if (isHidden) {
    return null; 
  }

  // Baqi poori app (Homepage, Dashboard) par Navbar show hoga
  return <Navbar />;
}