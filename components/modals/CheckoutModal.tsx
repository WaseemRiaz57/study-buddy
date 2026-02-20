"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Shield,
  Tag,
  Smartphone,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore"; // <--- NAYI LINE: Store import

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number;
  billingCycle: "monthly" | "yearly";
}

type PaymentMethod = "card" | "paypal" | "apple";

type CheckoutStage = "idle" | "processing" | "success";

/* ────────────────────────────────────────────────
   PayPal & Apple Pay SVG icons (tiny inline)
   ──────────────────────────────────────────────── */

function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="20"
      height="20"
    >
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return <Smartphone className={className} size={20} />;
}

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

export default function CheckoutModal({
  isOpen,
  onClose,
  planName,
  price,
  billingCycle,
}: CheckoutModalProps) {
  /* ── NAYI LINE: Store se setPlan function lena ── */
  const setPlan = useUserStore((state) => state.setPlan);

  /* ── state ── */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [stage, setStage] = useState<CheckoutStage>("idle");

  // Card form fields (UI only)
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  /* ── helpers ── */
  const formattedPrice = `$${price.toFixed(2)}`;
  const cycleLabel = billingCycle === "yearly" ? "year" : "month";

  const resetState = useCallback(() => {
    setStage("idle");
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setCardName("");
    setPromoCode("");
    setPromoOpen(false);
    setPaymentMethod("card");
  }, []);

  /* ── lock scroll ── */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Escape to close ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "processing") {
        onClose();
        resetState();
      }
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, stage, resetState]);

  /* ── format card number with spaces ── */
  function handleCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  }

  /* ── format expiry ── */
  function handleExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  }

  /* ── NAYA MOCK SUBMIT (Plan update logic ke sath) ── */
  function handleSubmit() {
    if (stage !== "idle") return;
    setStage("processing");
    setTimeout(() => {
      setStage("success");
      
      // Update plan in global store based on planName
      if (planName.toLowerCase().includes("elite")) {
        setPlan("ELITE");
      } else if (planName.toLowerCase().includes("pro")) {
        setPlan("PRO");
      }

      setTimeout(() => {
        onClose();
        resetState();
      }, 1600);
    }, 2200);
  }

  /* ── payment method tabs ── */
  const methods: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: "card", label: "Card", icon: <CreditCard size={18} /> },
    { key: "paypal", label: "PayPal", icon: <PayPalIcon className="w-[18px] h-[18px]" /> },
    { key: "apple", label: "Apple Pay", icon: <AppleIcon className="w-[18px] h-[18px]" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── backdrop ── */
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (stage !== "processing") {
              onClose();
              resetState();
            }
          }}
        >
          {/* ── modal card ── */}
          <motion.div
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl dark:shadow-[0_0_60px_rgba(140,48,232,0.08)]"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── header ── */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock size={16} />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Complete Your Upgrade
                </h2>
              </div>
              <button
                onClick={() => {
                  if (stage !== "processing") {
                    onClose();
                    resetState();
                  }
                }}
                className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── scrollable body ── */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5 scrollbar-none">
              {/* ── order summary ── */}
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order Summary
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {planName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Billed {billingCycle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {formattedPrice}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{cycleLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── payment method toggle ── */}
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Payment Method
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                        paymentMethod === m.key
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {m.icon}
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── credit card form ── */}
              <AnimatePresence mode="wait">
                {paymentMethod === "card" && (
                  <motion.div
                    key="card-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Card Number */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => handleCardNumber(e.target.value)}
                        className="peer w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        maxLength={19}
                        inputMode="numeric"
                      />
                      <CreditCard
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                      />
                    </div>

                    {/* Expiry + CVC */}
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => handleExpiry(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        maxLength={5}
                        inputMode="numeric"
                      />
                      <input
                        type="text"
                        placeholder="CVC"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        maxLength={4}
                        inputMode="numeric"
                      />
                    </div>

                    {/* Cardholder Name */}
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                  </motion.div>
                )}

                {paymentMethod === "paypal" && (
                  <motion.div
                    key="paypal-info"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                      <PayPalIcon className="text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        You will be redirected to PayPal to complete your payment
                        securely.
                      </p>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "apple" && (
                  <motion.div
                    key="apple-info"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                      <AppleIcon className="text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Apple Pay will open a secure payment sheet on your
                        device.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── promo code ── */}
              <div>
                <button
                  onClick={() => setPromoOpen(!promoOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-soft transition"
                >
                  <Tag size={14} />
                  Add discount code
                  {promoOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                <AnimatePresence>
                  {promoOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                        <button className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20">
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── footer ── */}
            <div className="border-t border-border px-6 py-4 space-y-3">
              {/* CTA button */}
              <motion.button
                whileHover={stage === "idle" ? { scale: 1.02 } : {}}
                whileTap={stage === "idle" ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={stage !== "idle"}
                className={`relative flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all ${
                  stage === "success"
                    ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    : "bg-gradient-to-r from-primary via-primary-soft to-primary bg-[length:200%_100%] text-primary-foreground shadow-[0_0_24px_rgba(140,48,232,0.25)] hover:shadow-[0_0_36px_rgba(140,48,232,0.4)]"
                }`}
              >
                <AnimatePresence mode="wait">
                  {stage === "idle" && (
                    <motion.span
                      key="pay-label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Lock size={16} />
                      {paymentMethod === "paypal"
                        ? `Pay with PayPal — ${formattedPrice}`
                        : paymentMethod === "apple"
                          ? `Pay with Apple Pay — ${formattedPrice}`
                          : `Subscribe for ${formattedPrice}/${cycleLabel}`}
                    </motion.span>
                  )}
                  {stage === "processing" && (
                    <motion.span
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 size={18} className="animate-spin" />
                      Processing…
                    </motion.span>
                  )}
                  {stage === "success" && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={20} strokeWidth={3} />
                      Payment Successful!
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield size={13} className="text-emerald-500" />
                <span>
                  Secured by <span className="font-semibold">Stripe</span> —
                  256-bit SSL encryption
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}