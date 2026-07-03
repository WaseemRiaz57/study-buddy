"use client";

import CheckoutModal from "@/components/modals/CheckoutModal";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Zap,
  Users,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { useUserStore, type Plan } from "@/store/useUserStore";
import { PRICING_PLANS, calculateYearlyPrice, getYearlyTotal } from "@/lib/pricingConfig";

/* ═══════════════════════════════════════════════════════════════════ */
/* TYPES & DATA                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: Plan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: LucideIcon;
  features: PricingFeature[];
  accent: string;        // tailwind color token
  glowColor: string;     // raw rgba for box-shadow
  badge?: string;
  popular?: boolean;
  premium?: boolean;
}

const planIconMap: Record<string, LucideIcon> = {
  free: Users,
  pro: Zap,
  elite: Crown,
};

const plans: PricingPlan[] = PRICING_PLANS.map((plan) => ({
  id: (plan.id === "free" ? "FREE" : plan.id.toUpperCase()) as Plan,
  name: plan.name,
  tagline: plan.description,
  monthlyPrice: plan.price,
  yearlyPrice: plan.price === 0 ? 0 : Math.round(plan.price * 0.8 * 100) / 100,
  icon: planIconMap[plan.id],
  accent: plan.id === "elite" ? "purple" : plan.id === "pro" ? "purple" : "slate",
  glowColor: "rgba(124,58,237,0.22)",
  badge: plan.featured ? "Most Popular" : plan.id === "elite" ? "Best Value" : undefined,
  popular: Boolean(plan.featured),
  premium: plan.id === "elite",
  features: plan.features.map((text) => ({ text, included: true })),
}));
/* comparison table rows */
const comparisonRows = [
  { feature: "Study Rooms", community: "Up to 4", pro: "Unlimited", elite: "Unlimited" },
  { feature: "Quizzes", community: "Standard", pro: "Advanced + AI", elite: "Advanced + AI" },
  { feature: "Community Access", community: true, pro: true, elite: true },
  { feature: "Weekly Challenges", community: true, pro: true, elite: true },
  { feature: "AI Content Generator", community: false, pro: "Unlimited", elite: "Unlimited" },
  { feature: "Elite Challenges", community: false, pro: true, elite: true },
  { feature: "Ad-Free Experience", community: false, pro: true, elite: true },
  { feature: "Mentor Earnings", community: false, pro: false, elite: true },
  { feature: "Priority Matching", community: false, pro: false, elite: true },
  { feature: "Mythic Auras & Badges", community: false, pro: false, elite: true },
];

/* ═══════════════════════════════════════════════════════════════════ */
/* ANIMATION VARIANTS                                                */
/* ═══════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
} as const;

/* ═══════════════════════════════════════════════════════════════════ */
/* BILLING TOGGLE                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function BillingToggle({
  yearly,
  onChange,
}: {
  yearly: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm font-medium">
      <span className={yearly ? "text-muted-foreground" : "text-foreground"}>
        Monthly
      </span>
      <button
        onClick={() => onChange(!yearly)}
        className="relative h-7 w-14 rounded-full bg-muted transition-colors duration-300"
        aria-label="Toggle billing period"
      >
        <motion.span
          layout
          className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-primary shadow-md"
          animate={{ x: yearly ? 28 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
      <span className={yearly ? "text-foreground" : "text-muted-foreground"}>
        Yearly
        <span className="ml-1.5 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
          Save 20%
        </span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRICING CARD                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function PricingCard({
  plan,
  yearly,
  isCurrent,
  onUpgradeClick,
}: {
  plan: PricingPlan;
  yearly: boolean;
  isCurrent: boolean;
  onUpgradeClick: () => void;
}) {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const Icon = plan.icon;

  const isInteractive = !isCurrent && plan.id !== "FREE";

  /* border / glow style for popular & premium */
  const borderClass = plan.popular
    ? "border-purple-500/60 dark:border-purple-500/50"
    : plan.premium
      ? "border-amber-400/60 dark:border-amber-400/50"
      : "border-border";

  const glowStyle = plan.popular || plan.premium
    ? { boxShadow: `0 0 30px ${plan.glowColor}` }
    : {};

  return (
    <motion.div
      variants={cardVariants}
      whileHover={isInteractive ? { y: -8, scale: 1.02 } : {}}
      className={`
        relative flex flex-col rounded-2xl border-2 p-6 sm:p-8
        backdrop-blur-xl transition-colors
        bg-white/60 dark:bg-white/[0.04]
        ${borderClass}
        ${plan.popular ? "lg:scale-105 z-10" : ""}
      `}
      style={glowStyle}
    >
      {/* Badge */}
      {plan.badge && (
        <span
          className={`
            absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide
            ${plan.popular
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
            }
          `}
        >
          {plan.badge}
        </span>
      )}

      {/* Icon + Name */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`
            flex h-11 w-11 items-center justify-center rounded-xl
            ${plan.popular
              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
              : plan.premium
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {price === 0 ? "Free" : `$${price.toFixed(2)}`}
          </span>
          {price > 0 && (
            <span className="mb-1 text-sm text-muted-foreground">/mo</span>
          )}
        </div>
        {price > 0 && yearly && (
          <p className="mt-1 text-xs text-muted-foreground">
            Billed ${(price * 12).toFixed(2)}/year
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm">
            {f.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
            )}
            <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <CtaButton plan={plan} isCurrent={isCurrent} onClick={onUpgradeClick} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CTA BUTTON                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

function CtaButton({ 
  plan, 
  isCurrent, 
  onClick 
}: { 
  plan: PricingPlan; 
  isCurrent: boolean; 
  onClick: () => void; 
}) {
  if (isCurrent) {
    return (
      <button
        disabled
        className="w-full rounded-xl border-2 border-border py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed"
      >
        Current Plan
      </button>
    );
  }

  if (plan.id === "FREE") {
    return (
      <button className="w-full rounded-xl border-2 border-border py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
        Downgrade
      </button>
    );
  }

  const base = "bg-[#7C3AED] hover:bg-purple-700 shadow-lg shadow-purple-500/25 text-white";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${base}`}
    >
      {plan.premium ? "Go Elite" : "Upgrade to Pro"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* COMPARISON TABLE                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

function ComparisonTable() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="mt-20"
    >
      <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
        Compare Plans
      </h2>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-4 font-semibold text-foreground">Feature</th>
              <th className="px-6 py-4 text-center font-semibold text-foreground">Community</th>
              <th className="px-6 py-4 text-center font-semibold text-purple-600 dark:text-purple-400">Pro</th>
              <th className="px-6 py-4 text-center font-semibold text-amber-600 dark:text-amber-400">Elite</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr
                key={row.feature}
                className={`border-b border-border/50 last:border-0 ${
                  i % 2 === 0 ? "bg-muted/30" : ""
                }`}
              >
                <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                {(["community", "pro", "elite"] as const).map((tier) => {
                  const val = row[tier];
                  return (
                    <td key={tier} className="px-6 py-3.5 text-center">
                      {val === true ? (
                        <Check className="mx-auto h-4 w-4 text-green-500" />
                      ) : val === false ? (
                        <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : (
                        <span className="text-foreground">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* FAQ SECTION                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — there are no contracts. Cancel your subscription at any time from your account settings.",
  },
  {
    q: "Will I lose progress if I downgrade?",
    a: "Never. All your study data, badges, and notes are kept. You just lose access to premium features.",
  },
  {
    q: "Is there a student discount?",
    a: "Absolutely! Verify your .edu email to get an extra 15% off any paid plan.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="mx-auto mt-20 max-w-2xl"
    >
      <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
        Frequently Asked Questions
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              {faq.q}
              <motion.span
                animate={{ rotate: open === i ? 45 : 0 }}
                className="text-lg text-muted-foreground"
              >
                +
              </motion.span>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: open === i ? "auto" : 0,
                opacity: open === i ? 1 : 0,
              }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PAGE                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const initialBilling = searchParams.get("billing") === "yearly";
  const planParam = searchParams.get("plan");

  const [yearly, setYearly] = useState(initialBilling);
  const currentPlan = useUserStore((s) => s.plan);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    if (planParam) {
      const targetPlan = plans.find(p => p.id.toLowerCase() === planParam.toLowerCase());
      if (targetPlan) {
        setSelectedPlan(targetPlan);
        setIsCheckoutOpen(true);
      }
    }
  }, [planParam]);

  const handleUpgradeClick = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      {/* ── Background Decoration ───────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[320px] w-[min(700px,90vw)] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-600/15 sm:h-[500px]" />
        <div className="absolute top-60 right-0 h-[300px] w-[400px] rounded-full bg-amber-400/10 blur-[100px] dark:bg-amber-500/10" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            Pricing &amp; Plans
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Unlock Your Full{" "}
            <span className="text-[#7C3AED]">
              Potential
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Choose the plan that fits your learning journey. Upgrade anytime —
            downgrade whenever you want. No hidden fees.
          </p>

          <div className="mt-8">
            <BillingToggle yearly={yearly} onChange={setYearly} />
          </div>
        </motion.div>

        {/* ── Pricing Cards ─────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-3 lg:gap-8 items-start"
        >
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
              isCurrent={currentPlan === plan.id}
              onUpgradeClick={() => handleUpgradeClick(plan)}
            />
          ))}
        </motion.div>

        {/* ── Comparison Table ──────────────────────────────────── */}
        <ComparisonTable />

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <FAQ />

        {/* ── Bottom CTA ────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-20 mb-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Have questions?{" "}
            <button className="font-semibold text-purple-600 hover:underline dark:text-purple-400">
              Chat with us
            </button>{" "}
            — we{"'"}re happy to help.
          </p>
        </motion.div>
      </div>

      {selectedPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          planName={`${selectedPlan.name} Plan`}
          price={yearly ? getYearlyTotal(selectedPlan.monthlyPrice) : selectedPlan.monthlyPrice}
          billingCycle={yearly ? "yearly" : "monthly"}
        />
      )}
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Loading...</div>}>
      <UpgradePageContent />
    </Suspense>
  );
}
