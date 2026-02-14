import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#community", label: "Community" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0a16]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          StudyBuddy
        </Link>
        <div className="hidden items-center gap-8 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/70 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-primary hover:text-primary md:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_rgba(140,48,232,0.35)] transition hover:scale-[1.02]"
          >
            Get started
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
