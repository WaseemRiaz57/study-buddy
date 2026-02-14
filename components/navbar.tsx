"use client";

import { Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";

const navItems = [
  { href: "#focus-room", label: "Focus Room" },
  { href: "#ai-tools", label: "AI Tools" },
  { href: "#marketplace", label: "Marketplace" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-background/60 backdrop-blur-md dark:border-white/10 dark:bg-[#0f0a16]/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">StudyBuddy</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <div className={`absolute left-0 right-0 top-full flex flex-col gap-6 border-t border-slate-200 bg-background/80 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0f0a16]/80 md:relative md:top-auto md:flex-row md:border-0 md:bg-transparent md:px-0 md:py-0 md:text-sm ${isOpen ? "block" : "hidden md:flex"}`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-700 transition hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:text-primary dark:text-white/80 dark:hover:text-primary md:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(140,48,232,0.3)] transition hover:scale-[1.02]"
          >
            Join Free
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
