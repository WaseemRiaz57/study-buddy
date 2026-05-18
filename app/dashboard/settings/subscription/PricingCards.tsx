"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Users, Zap, type LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  pricingPlans as fallbackPricingPlans,
  type PricingPlanConfig,
  type SubscriptionPlanId,
} from "@/lib/pricingConfig";

const planIconMap: Record<SubscriptionPlanId, LucideIcon> = {
  free: Users,
  pro: Zap,
  elite: Crown,
};

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

export default function PricingCards() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<PricingPlanConfig[]>(fallbackPricingPlans);
  const [isLoading, setIsLoading] = useState(true);
  const role = String(session?.user?.role || "student").toLowerCase();
  const roleFeature =
    role === "teacher" || role === "mentor"
      ? "Teacher tools for quizzes, sessions, and resource selling"
      : "Student tools for notes, focus rooms, and peer study";

  useEffect(() => {
    let active = true;

    async function fetchPlans() {
      try {
        const response = await fetch("/api/subscription-plans", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (active && response.ok && Array.isArray(data?.plans)) {
          setPlans(data.plans);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchPlans();

    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.section
      aria-label="Subscription pricing cards"
      className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-3 lg:gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {plans.map((plan) => {
        const Icon = planIconMap[plan.id];

        return (
          <motion.article
            key={plan.id}
            variants={cardVariants}
            className={`relative flex min-h-[420px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 lg:p-8 ${
              plan.featured
                ? "border-2 border-[#7C3AED] shadow-[#7C3AED]/15 md:scale-105"
                : "border-slate-200 hover:border-[#7C3AED] dark:border-slate-700"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                Most Popular
              </div>
            )}
            {isLoading && (
              <div className="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-[#7C3AED]" />
            )}

            <div className="mb-1 flex items-center gap-3">
              <Icon
                size={24}
                className={
                  plan.featured ? "text-[#7C3AED]" : "text-slate-600 dark:text-slate-400"
                }
              />
              <h3
                className={`text-2xl font-bold ${
                  plan.featured
                    ? "text-[#7C3AED]"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {plan.name}
              </h3>
            </div>

            <p className="mt-2 min-h-10 text-sm text-slate-600 dark:text-slate-300">
              {plan.description}
            </p>

            <div className="mb-8 mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">
                {plan.displayPrice}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                / month
              </span>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {[...plan.features, roleFeature].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={
                plan.id === "free"
                  ? "w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  : "w-full rounded-xl bg-[#7C3AED] px-4 py-3 font-bold text-white transition-colors hover:bg-purple-700"
              }
            >
              {plan.cta}
            </button>
          </motion.article>
        );
      })}
    </motion.section>
  );
}
