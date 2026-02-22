"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Crown,
  Zap,
  BookOpen,
  CheckCircle2,
  Star,
  ArrowRight,
  Users,
  Shield,
  Gem,
  GraduationCap,
  Rocket,
} from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types & Data                                                        */
/* ------------------------------------------------------------------ */
interface Tier {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  accent: "default" | "purple" | "gold";
  popular?: boolean;
  cta: string;
}

const tiers: Tier[] = [
  {
    id: "standard",
    name: "Standard",
    subtitle: "For curious minds",
    icon: <BookOpen className="w-7 h-7" />,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Access community forums",
      "Basic study rooms (3/week)",
      "Public resource library",
      "5 AI study prompts/day",
      "Standard support",
    ],
    accent: "default",
    cta: "Current Plan",
  },
  {
    id: "pro",
    name: "Pro Scholar",
    subtitle: "For dedicated learners",
    icon: <Rocket className="w-7 h-7" />,
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    features: [
      "Unlimited study rooms",
      "AI-powered study buddy",
      "Priority mentorship matching",
      "Progress analytics dashboard",
      "Unlimited AI prompts",
      "Ad-free experience",
    ],
    accent: "purple",
    popular: true,
    cta: "Upgrade Now",
  },
  {
    id: "elite",
    name: "Elite Master",
    subtitle: "For future leaders",
    icon: <Crown className="w-7 h-7" />,
    monthlyPrice: 19.99,
    annualPrice: 15.99,
    features: [
      "Everything in Pro Scholar",
      "1-on-1 mentor sessions (4/mo)",
      "Exclusive masterclass events",
      "Custom learning pathways",
      "Priority support & coaching",
      "Mythic badge & leaderboard boost",
      "Early access to new features",
    ],
    accent: "gold",
    cta: "Go Elite",
  },
];

/* ------------------------------------------------------------------ */
/* Toggle Pill                                                         */
/* ------------------------------------------------------------------ */
function BillingToggle({
  annual,
  onToggle,
}: {
  annual: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-semibold transition-colors ${
          !annual
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        Monthly
      </span>

      <button
        onClick={onToggle}
        className="relative h-8 w-16 rounded-full bg-slate-200 dark:bg-white/10 transition-colors"
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          className="absolute top-1 h-6 w-6 rounded-full bg-primary shadow-lg shadow-primary/30"
          animate={{ left: annual ? 34 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <span
        className={`text-sm font-semibold transition-colors ${
          annual
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        Annual
      </span>

      <AnimatePresence>
        {annual && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            className="ml-1 rounded-full bg-accent-mint/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-accent-mint border border-accent-mint/30"
          >
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tier Card                                                           */
/* ------------------------------------------------------------------ */
function TierCard({
  tier,
  annual,
  index,
}: {
  tier: Tier;
  annual: boolean;
  index: number;
}) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const isPurple = tier.accent === "purple";
  const isGold = tier.accent === "gold";
  const isFree = price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className={`relative flex flex-col rounded-3xl p-[1px] transition-transform duration-300 ${
        isPurple ? "scale-100 lg:scale-[1.05] z-10" : ""
      }`}
    >
      {/* Glow border wrapper */}
      <div
        className={`absolute inset-0 rounded-3xl ${
          isPurple
            ? "bg-gradient-to-b from-primary via-primary/60 to-primary/30 shadow-[0_0_60px_-10px_rgba(140,48,232,0.5)]"
            : isGold
            ? "animate-[glow-slide_3s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_50px_-10px_rgba(255,215,0,0.4)]"
            : "bg-gradient-to-b from-slate-200 to-slate-100 dark:from-white/15 dark:to-white/5"
        }`}
      />

      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Most Popular
          </motion.div>
        </div>
      )}

      {/* Card body */}
      <div
        className={`relative flex flex-1 flex-col rounded-[calc(1.5rem-1px)] p-8 ${
          isPurple
            ? "bg-[#1a0f26] text-white"
            : isGold
            ? "bg-gradient-to-br from-[#1a0f26] via-[#231a2e] to-[#1a0f26] text-white"
            : "bg-white dark:bg-[#1a0f26] text-slate-900 dark:text-white"
        }`}
      >
        {/* Gold mesh overlay */}
        {isGold && (
          <div className="pointer-events-none absolute inset-0 rounded-[calc(1.5rem-1px)] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,215,0,0.08)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,215,0,0.06)_0%,transparent_60%)]" />
            <motion.div
              className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent-gold/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        {/* Purple glow overlay */}
        {isPurple && (
          <div className="pointer-events-none absolute inset-0 rounded-[calc(1.5rem-1px)] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(140,48,232,0.15)_0%,transparent_60%)]" />
            <motion.div
              className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}

        <div className="relative z-10 flex flex-1 flex-col">
          {/* Icon + name */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                isPurple
                  ? "bg-primary/20 text-primary"
                  : isGold
                  ? "bg-accent-gold/20 text-accent-gold"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              {tier.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p
                className={`text-xs ${
                  isPurple || isGold
                    ? "text-white/60"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {tier.subtitle}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {isFree ? "Free" : `$${price.toFixed(2)}`}
              </span>
              {!isFree && (
                <span
                  className={`text-sm ${
                    isPurple || isGold
                      ? "text-white/50"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  /month
                </span>
              )}
            </div>
            {!isFree && annual && (
              <p
                className={`mt-1 text-xs ${
                  isPurple || isGold
                    ? "text-white/40"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                Billed ${(price * 12).toFixed(2)} annually
              </p>
            )}
          </div>

          {/* Divider */}
          <div
            className={`h-px mb-6 ${
              isPurple
                ? "bg-white/10"
                : isGold
                ? "bg-accent-gold/20"
                : "bg-slate-100 dark:bg-white/10"
            }`}
          />

          {/* Features */}
          <ul className="flex-1 space-y-3 mb-8">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isPurple
                      ? "text-primary"
                      : isGold
                      ? "text-accent-gold"
                      : "text-accent-mint"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isPurple || isGold
                      ? "text-white/80"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            className={`group relative w-full rounded-xl py-3.5 font-bold text-sm transition-all duration-300 overflow-hidden ${
              isPurple
                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-110"
                : isGold
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-110"
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            }`}
          >
            {/* Shimmer sweep */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              <span className="absolute inset-0 -translate-x-full animate-[shimmer-slide_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </span>

            <span className="relative flex items-center justify-center gap-2">
              {tier.cta}
              {tier.id !== "standard" && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Social Proof Bar                                                    */
/* ------------------------------------------------------------------ */
function SocialProof() {
  const stats = [
    { icon: <Users className="w-5 h-5" />, label: "50K+ scholars" },
    { icon: <Star className="w-5 h-5" />, label: "4.9★ rating" },
    { icon: <Shield className="w-5 h-5" />, label: "Bank-grade security" },
    { icon: <Gem className="w-5 h-5" />, label: "Cancel anytime" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
        >
          <span className="text-primary">{s.icon}</span>
          {s.label}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ Section                                                         */
/* ------------------------------------------------------------------ */
const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Absolutely. Upgrade, downgrade, or cancel with one click — no lock-in contracts.",
  },
  {
    q: "Is there a free trial for Pro or Elite?",
    a: "Yes! Every new user gets a 7-day Pro Scholar trial. No credit card required.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept Visa, Mastercard, AMEX, and PayPal. All transactions are encrypted.",
  },
  {
    q: "Do I keep my data if I downgrade?",
    a: "Your study history and progress are always safe. Some premium features will be limited.",
  },
];

function FAQItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.08 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          className="ml-4 shrink-0 text-primary"
        >
          <Zap className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function UpgradePage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ---- ambient blobs ---- */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-accent-gold/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* ---- Hero ---- */}
        <section className="text-center mb-14 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary mb-6">
              <GraduationCap className="w-3.5 h-3.5" />
              Ascend to Wisdom
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              <span className="text-slate-900 dark:text-white">
                Unlock Your&nbsp;
              </span>
              <span className="text-shimmer">Full Potential</span>
            </h1>

            <p className="mx-auto max-w-xl text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              Choose the path that matches your ambition. Every plan fuels your
              journey toward mastery.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <div className="mt-8">
            <BillingToggle
              annual={annual}
              onToggle={() => setAnnual(!annual)}
            />
          </div>
        </section>

        {/* ---- Pricing Grid ---- */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-start mb-20">
          {tiers.map((t, i) => (
            <TierCard key={t.id} tier={t} annual={annual} index={i} />
          ))}
        </section>

        {/* ---- Social Proof ---- */}
        <section className="mb-20">
          <SocialProof />
        </section>

        {/* ---- FAQ ---- */}
        <section className="mx-auto max-w-2xl mb-12">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FAQItem key={f.q} q={f.q} a={f.a} idx={i} />
            ))}
          </div>
        </section>

        {/* ---- Mentor CTA ---- */}
        <section className="mx-auto max-w-3xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 md:p-10 text-center"
          >
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <GraduationCap className="mx-auto w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Ready to Teach &amp; Earn?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Share your expertise as a StudyBuddy mentor. Set your own rates, build
              your reputation, and help the next generation of scholars.
            </p>
            <Link
              href="/dashboard/settings/mentorship"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Start Mentorship Setup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* ---- Back link ---- */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
