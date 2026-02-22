"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Pricing data                                                        */
/* ------------------------------------------------------------------ */
interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  icon: LucideIcon;
  monthlyCoins: number;
  yearlyCoins: number;
  features: PricingFeature[];
  cta: string;
  /** Is this the user's current plan? */
  current?: boolean;
  /** Middle card highlight */
  popular?: boolean;
  /** Third card gold treatment */
  elite?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Standard",
    icon: Users,
    monthlyCoins: 0,
    yearlyCoins: 0,
    current: true,
    cta: "Current Plan",
    features: [
      { text: "Basic Study Rooms (up to 4)", included: true },
      { text: "Standard Quizzes", included: true },
      { text: "Community Forum Access", included: true },
      { text: "Weekly Challenges", included: true },
      { text: "AI Content Generator", included: false },
      { text: "Priority Matching", included: false },
    ],
  },
  {
    name: "Pro Scholar",
    icon: Zap,
    monthlyCoins: 499,
    yearlyCoins: 399,
    popular: true,
    cta: "Upgrade to Pro",
    features: [
      { text: "Everything in Standard", included: true },
      { text: "Unlimited AI Generator", included: true },
      { text: "Elite Challenges", included: true },
      { text: "Ad-Free Experience", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "Mythic Auras & Badges", included: false },
    ],
  },
  {
    name: "Elite Master",
    icon: Crown,
    monthlyCoins: 999,
    yearlyCoins: 799,
    elite: true,
    cta: "Unlock Elite",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlock Mentor Earnings", included: true },
      { text: "Priority Student Matching", included: true },
      { text: "Exclusive Mythic Auras", included: true },
      { text: "Private Focus Rooms", included: true },
      { text: "Early Access to Features", included: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function SubscriptionPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="pb-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Header ── */}
        <div className="text-center mb-10 relative">
          {/* Badge */}
          <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
            <Sparkles size={14} />
            Unlock Your Potential
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Ascend to a New Tier of Wisdom
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the path that best illuminates your journey.
          </p>
        </div>

        {/* ── Monthly / Annual toggle ── */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              !annual
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              annual
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Annual (-20%)
          </button>
        </div>

        {/* ── Pricing Cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full items-start"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tiers.map((tier) => {
            const coins = annual ? tier.yearlyCoins : tier.monthlyCoins;

            /* Card border / bg / shadow differ per tier */
            let cardCls =
              "rounded-2xl p-6 lg:p-8 flex flex-col border transition-shadow";

            if (tier.popular) {
              /* Middle: purple glow + scale + z-index */
              cardCls +=
                " border-2 border-primary shadow-[0_0_20px_rgba(140,48,232,0.3)] md:scale-105 z-10 bg-white dark:bg-slate-900";
            } else if (tier.elite) {
              /* Third: gold gradient */
              cardCls +=
                " border border-yellow-400 dark:border-yellow-500/40 shadow-[0_0_20px_rgba(251,191,36,0.2)] bg-gradient-to-b from-white to-yellow-50 dark:from-slate-900 dark:to-yellow-900/10";
            } else {
              /* Standard */
              cardCls +=
                " border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm";
            }

            return (
              <motion.div
                key={tier.name}
                variants={cardVariants}
                className={`${cardCls} relative`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Tier icon + name */}
                <div className="flex items-center gap-3 mb-1">
                  <tier.icon
                    size={24}
                    className={
                      tier.popular
                        ? "text-primary"
                        : tier.elite
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-slate-600 dark:text-slate-400"
                    }
                  />
                  <h3
                    className={`text-2xl font-bold ${
                      tier.popular
                        ? "text-primary"
                        : tier.elite
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {tier.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-8 flex items-baseline gap-1 mt-3">
                  <span
                    className={`font-bold ${
                      tier.popular ? "text-4xl" : "text-3xl"
                    } text-slate-900 dark:text-white`}
                  >
                    {coins}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    coins / month
                  </span>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          f.included
                            ? tier.elite
                              ? "text-yellow-500"
                              : "text-primary"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          f.included
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-400 dark:text-slate-500 line-through"
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {tier.current ? (
                  <button className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {tier.cta}
                  </button>
                ) : tier.popular ? (
                  <button className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors">
                    {tier.cta}
                  </button>
                ) : (
                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold shadow-lg shadow-yellow-500/25 hover:from-yellow-500 hover:to-yellow-700 transition-colors">
                    {tier.cta}
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
