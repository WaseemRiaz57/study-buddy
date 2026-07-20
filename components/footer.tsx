"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Twitter, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const productLinks = [
  { label: "Focus Room", href: "/login" },
  { label: "AI Generator", href: "/login" },
  { label: "Marketplace", href: "/login" },
];

const companyLinks = [
  { label: "Community", href: "/login" },
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
];

const socialLinks = [
  { icon: Github, href: "https://github.com/studybuddy", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/studybuddy", label: "Twitter" },
  { icon: MessageCircle, href: "https://discord.gg/studybuddy", label: "Discord" },
];

export function Footer() {
  const pathname = usePathname();
  
  // Authentication routes own the entire viewport with their split-screen layout.
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Link
              href="/"
              aria-label="StudyBuddy home"
              className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
            >
              <BrandLogo />
            </Link>
            <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">
              Leveling up the way students learn and collaborate globally.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">Product</h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link, index) => (
  <li key={index}>
                  <Link
                    href={link.href}
                    prefetch={true}
                    className="text-sm text-slate-600 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest">Company</h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={true}
                    className="text-sm text-slate-600 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 dark:border-white/10 sm:flex-row">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            © 2026 StudyBuddy. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-primary hover:text-primary dark:border-white/10 dark:text-gray-400 dark:hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

