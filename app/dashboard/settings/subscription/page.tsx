"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const PricingCards = dynamic(() => import("./PricingCards"), {
  ssr: false,
  loading: () => (
    <section
      aria-label="Loading subscription plans"
      className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        />
      ))}
    </section>
  ),
});

export default function SubscriptionPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <main className="pb-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <header className="text-center mb-10 relative">
          <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
            <Sparkles size={14} />
            Unlock Your Potential
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Ascend to a New Tier of Wisdom
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
            Choose the path that best illuminates your journey.
          </p>
        </header>

        <section
          className="flex items-center justify-center gap-4 mb-12"
          aria-label="Billing interval"
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              !annual
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              annual
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            Annual (-20%)
          </button>
        </section>

        <PricingCards annual={annual} />
      </motion.div>
    </main>
  );
}

