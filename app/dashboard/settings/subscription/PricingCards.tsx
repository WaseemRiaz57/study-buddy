"use client";

import { motion } from "framer-motion";
import { Check, Crown, Users, Zap, type LucideIcon } from "lucide-react";

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
  current?: boolean;
  popular?: boolean;
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

export default function PricingCards({ annual }: { annual: boolean }) {
  return (
    <motion.section
      aria-label="Subscription pricing cards"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full items-start"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {tiers.map((tier) => {
        const coins = annual ? tier.yearlyCoins : tier.monthlyCoins;
        let cardCls =
          "rounded-2xl p-6 lg:p-8 flex flex-col border transition-shadow";

        if (tier.popular) {
          cardCls +=
            " border-2 border-primary shadow-[0_0_20px_rgba(140,48,232,0.3)] md:scale-105 z-10 bg-white dark:bg-slate-900";
        } else if (tier.elite) {
          cardCls +=
            " border border-yellow-400 dark:border-yellow-500/40 shadow-[0_0_20px_rgba(251,191,36,0.2)] bg-[#7C3AED]    ";
        } else {
          cardCls +=
            " border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm";
        }

        return (
          <motion.article
            key={tier.name}
            variants={cardVariants}
            className={`${cardCls} relative`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
            )}

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

            <div className="mb-8 flex items-baseline gap-1 mt-3">
              <span
                className={`font-bold ${
                  tier.popular ? "text-4xl" : "text-3xl"
                } text-slate-900 dark:text-white`}
              >
                {coins}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                coins / month
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2.5">
                  <Check
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      feature.included
                        ? tier.elite
                          ? "text-yellow-500"
                          : "text-primary"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      feature.included
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500 line-through"
                    }`}
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {tier.current ? (
              <button className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {tier.cta}
              </button>
            ) : tier.popular ? (
              <button className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors">
                {tier.cta}
              </button>
            ) : (
              <button className="w-full py-3 rounded-xl bg-[#7C3AED]   text-white font-bold shadow-lg shadow-yellow-500/25   transition-colors">
                {tier.cta}
              </button>
            )}
          </motion.article>
        );
      })}
    </motion.section>
  );
}

