"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  CreditCard,
  Wallet,
  Trophy,
  Star,
  ShieldCheck,
  User,
  Building2,
  Hash,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Data                                                       */
/* ------------------------------------------------------------------ */

type PayoutMethod = "bank" | "stripe" | "wallet";

const METHODS: {
  id: PayoutMethod;
  icon: typeof Landmark;
  label: string;
  description: string;
}[] = [
  {
    id: "bank",
    icon: Landmark,
    label: "Bank Transfer",
    description: "Direct deposit via ACH or Wire",
  },
  {
    id: "stripe",
    icon: CreditCard,
    label: "Stripe Connect",
    description: "Instant payouts for verified accounts",
  },
  {
    id: "wallet",
    icon: Wallet,
    label: "Digital Wallet",
    description: "PayPal, Venmo, or CashApp",
  },
];

const STEPS = ["Select", "Details", "Confirm"] as const;

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Step progress bar with glowing tube */
function ProgressBar({ current }: { current: number }) {
  const pct = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Labels */}
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`text-xs font-bold uppercase tracking-wider ${
              i <= current
                ? "text-primary"
                : "text-slate-400 dark:text-slate-600"
            }`}
          >
            Step {i + 1}: {step}
          </span>
        ))}
      </div>

      {/* Track */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            boxShadow: "0 0 10px rgba(140,48,232,0.5)",
          }}
        >
          {/* Leading glow edge */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}

/** Rewards card */
function RewardsCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Trophy size={20} className="text-primary" />
        Your Rewards
      </h3>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-none">
          <Star size={20} />
        </div>
        <div>
          <p className="font-bold text-primary text-lg">+50 XP</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Setup Completion Bonus
          </p>
        </div>
      </div>
    </div>
  );
}

/** Security card with abstract gradient bg */
function SecurityCard() {
  return (
    <div className="bg-gradient-to-br from-primary to-purple-700 rounded-xl p-6 text-white shadow-lg shadow-purple-200 dark:shadow-none relative overflow-hidden">
      {/* Abstract blur shapes */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <ShieldCheck size={30} className="opacity-80" />
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded">
            SECURE
          </span>
        </div>
        <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
        <p className="text-sm text-purple-100 leading-relaxed">
          We use AES-256 encryption to protect your sensitive financial data.
          Your peace of mind is our priority.
        </p>
      </div>
    </div>
  );
}

/** Form input with leading icon */
function FormInput({
  label,
  placeholder,
  icon: Icon,
  type = "text",
  tracking,
}: {
  label: string;
  placeholder: string;
  icon: typeof User;
  type?: string;
  tracking?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <Icon size={18} />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white text-sm font-medium ${
            tracking ? "tracking-widest" : ""
          }`}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function EarningsSetupPage() {
  const [selected, setSelected] = useState<PayoutMethod>("bank");
  const currentStep = 0; // Step 1 active (0-indexed)

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-purple-50/50 dark:from-background dark:to-background text-slate-900 dark:text-slate-100 transition-colors">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-8">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Link Your Treasury
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl mx-auto">
              Connect your payout method securely to start receiving mentorship
              funds.
            </p>
          </motion.div>

          {/* ── Progress Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ProgressBar current={currentStep} />
          </motion.div>

          {/* ── Content Grid ── */}
          <div className="grid lg:grid-cols-12 gap-6 items-start mt-2">
            {/* Left Column - Context & Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-4 space-y-5"
            >
              <RewardsCard />
              <SecurityCard />
            </motion.div>

            {/* Right Column - Interactive Form */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-8"
            >
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none">
                {/* Section header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Select Payout Method
                  </h3>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    1 of 3
                  </span>
                </div>

                {/* ── Method Selection Cards ── */}
                <div className="grid md:grid-cols-3 gap-4">
                  {METHODS.map((method) => {
                    const isActive = selected === method.id;
                    const Icon = method.icon;

                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelected(method.id)}
                        className={`relative group flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          isActive
                            ? "border-primary bg-primary/5 hover:shadow-primary/10"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        {/* Active check */}
                        {isActive && (
                          <div className="absolute top-3 right-3 text-primary">
                            <CheckCircle size={20} />
                          </div>
                        )}

                        {/* Icon circle */}
                        <div
                          className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
                            isActive
                              ? "bg-white dark:bg-slate-800 text-primary"
                              : "bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 group-hover:text-primary"
                          }`}
                        >
                          <Icon size={28} />
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">
                          {method.label}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          {method.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* ── Banking Details Form ── */}
                <AnimatePresence mode="wait">
                  {selected === "bank" && (
                    <motion.div
                      key="bank-form"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                        Enter Banking Details
                      </h4>

                      <div className="grid gap-6">
                        <FormInput
                          label="Account Holder Name"
                          placeholder="e.g. Jane Doe"
                          icon={User}
                        />

                        <div className="grid md:grid-cols-2 gap-6">
                          <FormInput
                            label="Bank Name"
                            placeholder="e.g. Chase Bank"
                            icon={Building2}
                          />
                          <FormInput
                            label="Routing Number"
                            placeholder="9 digits"
                            icon={Hash}
                          />
                        </div>

                        <FormInput
                          label="Account Number"
                          placeholder="••••••••••••"
                          icon={Lock}
                          type="password"
                          tracking
                        />
                      </div>
                    </motion.div>
                  )}

                  {selected === "stripe" && (
                    <motion.div
                      key="stripe-form"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                        Connect Stripe Account
                      </h4>
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-primary">
                          <CreditCard size={28} />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                          You&apos;ll be redirected to Stripe to securely connect
                          your account. No banking details are stored on our
                          servers.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {selected === "wallet" && (
                    <motion.div
                      key="wallet-form"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                        Digital Wallet Details
                      </h4>
                      <div className="grid gap-6">
                        <FormInput
                          label="Wallet Email or Handle"
                          placeholder="e.g. janedoe@paypal.com"
                          icon={Wallet}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Footer Actions ── */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                  <button className="text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    Cancel Setup
                  </button>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="hidden md:inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                      +50 XP on completion
                    </span>
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                      Verify &amp; Connect
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
