"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const links = [
  { href: "#session", label: "How a session works" },
  { href: "#inside", label: "What's inside" },
  { href: "#plans", label: "Plans" },
  { href: "/dashboard/mentorship/find", label: "Find a mentor" },
];

export function Wordmark() {
  return (
    <span className="lamp-serif text-[1.6rem] leading-none tracking-[-0.02em]">
      StudyBuddy
    </span>
  );
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const primary = signedIn
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/register", label: "Start studying free" };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${
        scrolled || open
          ? "border-b border-[var(--lamp-rule)] bg-[rgb(15_20_32/0.86)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav aria-label="Primary" className="lamp-wrap flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" aria-label="StudyBuddy home" className="shrink-0">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-8 text-[0.95rem] lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="lamp-link text-[var(--lamp-paper)]/80 hover:text-[var(--lamp-paper)]">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          {!signedIn && (
            <Link href="/login" className="lamp-link text-[0.95rem]">
              Log in
            </Link>
          )}
          <Link href={primary.href} className="lamp-btn lamp-btn-primary !min-h-[2.75rem] !px-5 text-[0.9rem]">
            {primary.label}
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="relative -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="lamp-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            aria-hidden="true"
            className={`absolute h-px w-6 bg-[var(--lamp-paper)] transition-transform duration-300 ${
              open ? "rotate-45" : "-translate-y-[4px]"
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute h-px w-6 bg-[var(--lamp-paper)] transition-transform duration-300 ${
              open ? "-rotate-45" : "translate-y-[4px]"
            }`}
          />
        </button>
      </nav>

      <div
        id="lamp-mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-[var(--lamp-rule)] bg-[var(--lamp-ink)] lg:hidden"
      >
        <div className="lamp-wrap flex min-h-full flex-col justify-between py-8">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href} className="border-b border-[var(--lamp-rule)]">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="lamp-serif block py-5 text-[2rem] leading-tight tracking-[-0.02em]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3">
            <Link href={primary.href} onClick={() => setOpen(false)} className="lamp-btn lamp-btn-primary w-full">
              {primary.label}
            </Link>
            {!signedIn && (
              <Link href="/login" onClick={() => setOpen(false)} className="lamp-btn lamp-btn-ghost w-full">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
