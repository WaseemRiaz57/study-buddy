"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Clean, centered landing-page hero that matches the product mock-up.
 * Built to look identical in light mode and readable in dark mode.
 */
export default function HeroSection() {
  return (
    <section
      className="relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden bg-white px-5 py-24 dark:bg-[#0a0515] sm:px-8"
      aria-labelledby="studybuddy-hero-heading"
    >
      <div className="relative z-20 mx-auto max-w-4xl text-center">
        <h1
          id="studybuddy-hero-heading"
          className="text-balance text-5xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl md:text-7xl"
        >
          <span className="block text-slate-900 dark:text-white">
            Studying made social.
          </span>
          <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-violet-200 bg-clip-text text-transparent dark:from-violet-400 dark:via-violet-300 dark:to-violet-200">
            Success made certain.
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard/study-rooms"
            className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:-translate-y-0.5 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:w-auto dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            Begin a session
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:hover:bg-slate-800"
          >
            View dashboard
          </Link>
        </div>

        <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">
          No credit card required • Free forever plan
        </p>
      </div>
    </section>
  );
}
