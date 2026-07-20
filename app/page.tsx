"use client";

import {
  motion,
  useReducedMotion,
  useInView,
  useSpring,
  useMotionValue,
  useScroll,
  useTransform,
  AnimatePresence,
  Variants,
} from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  LucideIcon,
  Sparkles,
  Users,
  BookOpen,
  MessageSquare,
  Brain,
  Clock,
  Trophy,
  Store,
  GraduationCap,
  Zap,
  Star,
  Check,
  X,
  Target,
  Flame,
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSession } from "next-auth/react";
import { PRICING_PLANS, calculateYearlyPrice, formatPlanPrice, getYearlyTotal } from "@/lib/pricingConfig";
import HeroSection from "@/components/landing/hero/HeroSection";
import PremiumFinalCTA from "@/components/landing/PremiumFinalCTA";

// ============================================================================
// TYPES
// ============================================================================
interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  glow: string;
  badge?: string;
  badgeColor?: string;
}
interface PricingPlan {
  id: string;
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPkr: string;
  yearlyPkr: string;
  desc: string;
  highlight?: boolean;
  ctaText: string;
  features: string[];
  excluded?: string[];
  rawMonthlyPrice: number;
}
interface WorkflowStep { step: string; title: string; detail: string; }
interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
    role: string;
    image?: string;
    initials: string;
  };
}

function cleanReviewComment(comment: string) {
  return String(comment || "").trim().replace(/^["']|["']$/g, "");
}

function getReviewRoleMeta(role: string) {
  const normalizedRole = String(role || "student").toLowerCase();
  const isMentor = normalizedRole !== "student" && normalizedRole !== "admin";

  return {
    label: isMentor ? "Mentor" : "Student",
    className: isMentor ? "text-violet-300" : "text-gray-400",
  };
}

// ============================================================================
// DATA
// ============================================================================
const GLOW: Record<string, { icon: string; ring: string; bg: string }> = {
  purple:  { icon: "text-purple-400",  ring: "ring-purple-500/40",  bg: "bg-purple-500/10" },
  yellow:  { icon: "text-yellow-400",  ring: "ring-yellow-500/40",  bg: "bg-yellow-500/10" },
  blue:    { icon: "text-blue-400",    ring: "ring-blue-500/40",    bg: "bg-blue-500/10" },
  emerald: { icon: "text-emerald-400", ring: "ring-emerald-500/40", bg: "bg-emerald-500/10" },
  pink:    { icon: "text-pink-400",    ring: "ring-pink-500/40",    bg: "bg-pink-500/10" },
  violet:  { icon: "text-violet-400",  ring: "ring-violet-500/40",  bg: "bg-violet-500/10" },
  sky:     { icon: "text-sky-400",     ring: "ring-sky-500/40",     bg: "bg-sky-500/10" },
  amber:   { icon: "text-amber-400",   ring: "ring-amber-500/40",   bg: "bg-amber-500/10" },
  teal:    { icon: "text-teal-400",    ring: "ring-teal-500/40",    bg: "bg-teal-500/10" },
};

const features: Feature[] = [
  { icon: Brain,        title: "AI Content Generator",  description: "Generate comprehensive notes, summaries, and quizzes from any topic in seconds.", glow: "purple", badge: "Most Used", badgeColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { icon: Trophy,       title: "Gamified Challenges",   description: "Earn XP, badges, and climb leaderboards through interactive quizzes and streaks.", glow: "yellow", badge: "Popular", badgeColor: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" },
  { icon: Users,        title: "Live Study Rooms",      description: "Join virtual rooms to collaborate with peers in real-time with video and chat.", glow: "blue" },
  { icon: Store,        title: "Mentor Marketplace",   description: "Find expert mentors or sell your own high-quality study materials.", glow: "emerald", badge: "New", badgeColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { icon: Clock,        title: "Focus Room",            description: "Distraction-free environment with Pomodoro timer, ambient sounds, and deep-work tracking.", glow: "pink" },
  { icon: MessageSquare,title: "Community Forums",      description: "Ask questions, share insights, and engage with thousands of motivated learners.", glow: "violet" },
  { icon: BookOpen,     title: "Resource Hub",          description: "A shared digital library of notes, PDFs, and guides rated by the community.", glow: "sky" },
  { icon: GraduationCap,title: "Mentor Network",   description: "Connect with experienced mentors who guide you through tough subjects one-on-one.", glow: "amber" },
  { icon: Zap,          title: "Smart Analytics",       description: "Track your study hours, weak areas, and progress with AI-powered dashboards.", glow: "teal" },
];

const workflow: WorkflowStep[] = [
  { step: "01", title: "Set the ritual",  detail: "Pick a duration, mood, and focus goal to anchor each session." },
  { step: "02", title: "Enter the room",  detail: "Drop into a guided environment built for the task in front of you." },
  { step: "03", title: "Close the loop",  detail: "Reflect, capture outcomes, and queue the next milestone." },
];

const stats = [
  { value: "50K+",  label: "Active Scholars", icon: Users  },
  { value: "1M+",   label: "Study Hours",     icon: Clock  },
  { value: "98%",   label: "Success Rate",    icon: Target },
  { value: "4.9/5", label: "User Rating",     icon: Star   },
];

const fallbackPricingPlans: PricingPlan[] = PRICING_PLANS.map((plan) => ({
  id: plan.id,
  title: `${plan.name} Plan`,
  monthlyPrice: plan.displayPrice,
  yearlyPrice: formatPlanPrice(calculateYearlyPrice(plan.price)),
  monthlyPkr: plan.price === 0 ? "Free Forever" : "Billed monthly",
  yearlyPkr: plan.price === 0 ? "Free Forever" : `Billed $${getYearlyTotal(plan.price).toFixed(2)}/year`,
  desc: plan.description,
  highlight: plan.featured,
  ctaText: plan.cta,
  features: plan.features,
  rawMonthlyPrice: plan.price,
}));

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

// Liquid cubic-bezier — fast start, gentle settle
const ease = [0.16, 1, 0.3, 1] as const;

// Deeper "liquid" curve — slower glide-in, oily settle (used for cinematic reveals)
const liquidEase = [0.22, 1, 0.36, 1] as const;

// Soft spring — fluid settle with zero overshoot (the default "liquid" reveal feel)
const softSpring = { type: "spring", stiffness: 58, damping: 18, mass: 0.9 } as const;

// Liquid spring — a whisper of overshoot for hero / headline characters
const liquidSpring = { type: "spring", stiffness: 90, damping: 14, mass: 0.85 } as const;

// Stagger parent — drives staggerChildren for section grids
// Cinematic 3D word flip — rotateX up from behind, soft spring settle
// Children variant used inside staggered grids (Features, Hero text, CTA)
const fluidChild: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: softSpring },
};

// Stagger parent keyed to "visible" so it can drive fluidChild
const fluidParent: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15 } },
};

// ============================================================================
// FLOATING PARTICLES
// ============================================================================
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  size: (i % 3) + 1.5,
  duration: 12 + (i % 8),
  delay: (i % 5) * 1.2,
  driftX: ((i % 5) - 2) * 10,
}));

const FloatingParticles = memo(function FloatingParticles() {
  const isMobile = useIsMobile(768, true);
  const prefersReducedMotion = useReducedMotion();

  if (isMobile || prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-purple-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: isMobile ? [0, -20, 0] : [0, -40, 0],
            x: isMobile ? [0, 0, 0] : [0, p.driftX, 0],
            opacity: [0.1, 0.45, 0.1],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: liquidEase }}
        />
      ))}
    </div>
  );
});

// ============================================================================
// SECTION BADGE
// ============================================================================
function SectionBadge({ color, icon: Icon, label }: { color: string; icon: LucideIcon; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 50, damping: 15 }}
      className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${color}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </motion.div>
  );
}

// ============================================================================
// SPLIT TEXT — "Pretext"-style cinematic 3D reveal (char-by-char rotateX flip)
// ============================================================================
// Splits a string into words → characters, each flipping up from -90° on the X
// axis behind a shared perspective. Words stay nowrap so they never break
// mid-character, preserving the original copy and line-wrapping behaviour.
function SplitText({
  text,
  className = "",
  delay = 0,
  perChar = true,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  perChar?: boolean;
  once?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile(768, true);

  // Reduced-motion / SSR-safe: render the plain string, no transforms.
  if (prefersReducedMotion || isMobile) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: perChar ? 0.022 : 0.07, delayChildren: delay },
    },
  };
  const piece: Variants = {
    hidden: { opacity: 0, y: "0.6em", rotateX: -90 },
    show:   { opacity: 1, y: "0em",  rotateX: 0, transition: liquidSpring },
  };

  return (
    <motion.span
      aria-label={text}
      className={className}
      style={{ display: "inline-block", perspective: 700 }}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-100px" }}
    >
      {words.map((word, wi) => (
        <span
          key={wi}
          aria-hidden="true"
          className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {perChar ? (
            word.split("").map((char, ci) => (
              <motion.span
                key={ci}
                variants={piece}
                className="inline-block"
                style={{ transformOrigin: "bottom center" }}
              >
                {char}
              </motion.span>
            ))
          ) : (
            <motion.span
              variants={piece}
              className="inline-block"
              style={{ transformOrigin: "bottom center" }}
            >
              {word}
            </motion.span>
          )}
        </span>
      ))}
    </motion.span>
  );
}

// ============================================================================
// CINEMATIC LAYER — scroll-bound 3D depth (rotateX + scale + translateZ)
// ============================================================================
// Binds scroll progress through the element to a subtle 3D push: tilts on the
// X axis, recedes on Z and scales down as it enters/exits the viewport, behind
// a perspective container. Spring-smoothed so the depth glides like liquid.
// Disabled on mobile + reduced-motion to guarantee zero jank / no layout shift.
function CinematicLayer({
  children,
  className = "",
  intensity = 1,
  dim = true,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  dim?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile(768, true);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateXRaw = useTransform(scrollYProgress, [0, 0.5, 1], [6 * intensity, 0, -6 * intensity]);
  const scaleRaw   = useTransform(scrollYProgress, [0, 0.5, 1], [1 - 0.05 * intensity, 1, 1 - 0.05 * intensity]);
  const zRaw       = useTransform(scrollYProgress, [0, 0.5, 1], [-70 * intensity, 0, -70 * intensity]);
  const opacity    = useTransform(scrollYProgress, [0, 0.16, 0.84, 1], [0.7, 1, 1, 0.7]);

  const springCfg = { stiffness: 60, damping: 22, mass: 0.6 };
  const rotateX = useSpring(rotateXRaw, springCfg);
  const scale   = useSpring(scaleRaw, springCfg);
  const z       = useSpring(zRaw, springCfg);

  if (prefersReducedMotion || isMobile) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ perspective: 1300 }}>
      <motion.div
        className="will-change-transform"
        style={{
          rotateX,
          scale,
          z,
          opacity: dim ? opacity : undefined,
          transformStyle: "preserve-3d",
          transformOrigin: "center",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================================================
// ANIMATED SECTION HEADING — cinematic split-text 3D reveal
// ============================================================================
function SectionHeading({ children, className = "" }: { children: string; className?: string }) {
  return (
    <h2 className={`text-balance text-4xl font-semibold tracking-[-0.045em] text-foreground md:text-6xl ${className}`}>
      <SplitText text={children} />
    </h2>
  );
}

// ============================================================================
// FADE-OUT GRADIENT TEXT
// ============================================================================
// ============================================================================
// ANIMATED DIVIDER
// ============================================================================
function AnimatedDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.1, ease }}
      className="mx-auto h-px w-full max-w-5xl origin-center bg-gradient-to-r from-transparent via-violet-500/35 to-transparent"
    />
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = memo(function StatCard({
  value, label, icon: Icon, index,
}: { value: string; label: string; icon: LucideIcon; index: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isFractionStat = value.includes("/");
  const [fractionValue, fractionSuffix] = isFractionStat ? value.split("/") : ["", ""];
  const target = isFractionStat
    ? parseFloat(fractionValue)
    : parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = isFractionStat ? `/${fractionSuffix}` : value.replace(/[0-9.]/g, "");

  useEffect(() => {
    if (!isInView) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(isFractionStat ? Number((target * eased).toFixed(1)) : Math.floor(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isFractionStat, isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
      whileHover={{ y: -6, scale: 1.04 }}
      className="landing-glass flex flex-col items-center justify-center rounded-[1.6rem] p-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-violet-500/25 md:p-8"
    >
      <motion.div
        className="mb-3 rounded-xl bg-purple-500/10 p-3"
        whileHover={{ rotate: [0, -12, 12, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="h-5 w-5 text-purple-400" />
      </motion.div>
      <div className="mb-1 text-3xl font-semibold tabular-nums tracking-[-0.05em] text-foreground md:text-4xl">
        {count}{suffix}
      </div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</div>
    </motion.div>
  );
});

// ============================================================================
// FEATURE CARD
// ============================================================================
const FeatureCard = memo(function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  const g = GLOW[feature.glow] ?? GLOW.purple;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      variants={fluidChild}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 50, damping: 15 }}
      className={`landing-glass group relative cursor-pointer overflow-hidden rounded-[1.75rem] p-7 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-violet-500/25 hover:bg-[var(--landing-panel-strong)] ${index === 0 || index === 5 || index === 8 ? "lg:col-span-2" : ""}`}
    >
      {/* Shine sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20 opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100 dark:bg-white/5" />

      {feature.badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: (index % 3) * 0.1 + 0.35, duration: 0.4, type: "spring", stiffness: 50, damping: 15 }}
          className={`absolute right-4 top-4 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${feature.badgeColor}`}
        >
          {feature.badge}
        </motion.div>
      )}

      <motion.div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ${g.ring} ${g.bg}`}
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.7, ease }}
      >
        <Icon className={`h-5 w-5 ${g.icon}`} />
      </motion.div>

      <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
    </motion.div>
  );
});

// ============================================================================
// ANIMATED PROGRESS BAR
// ============================================================================
function AnimatedProgressBar({ pct, color = " " }: { pct: number; color?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
      <motion.div
        className={`h-full origin-left rounded-full bg-[#7C3AED] ${color}`}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: pct / 100 } : { scaleX: 0 }}
        transition={{ duration: 1.3, ease, delay: 0.35 }}
      />
    </div>
  );
}

// ============================================================================
// PRICING CARD
// ============================================================================
const PricingCard = memo(function PricingCard({
  plan, isYearly, index, session
}: { plan: PricingPlan; isYearly: boolean; index: number; session: any }) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const pkr   = isYearly ? plan.yearlyPkr   : plan.monthlyPkr;
  const [hovered, setHovered] = useState(false);
  const isActive = hovered || plan.highlight;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -10, scale: 1.025 }}
      className={`landing-glass relative flex h-full cursor-pointer flex-col rounded-[1.8rem] p-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        plan.highlight
          ? "border-violet-500/45 bg-violet-50/70 shadow-[0_30px_90px_-45px_rgba(124,58,237,.55)] dark:bg-violet-950/20"
          : hovered
          ? "border-violet-400/35 bg-violet-50/35 dark:bg-violet-950/10"
          : ""
      }`}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-2xl border border-purple-500/20"
          />
        )}
      </AnimatePresence>

      {plan.highlight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.13 + 0.3, type: "spring", stiffness: 280 }}
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED]   px-5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-lg"
        >
          Most Popular
        </motion.div>
      )}

      <div className="mb-8">
        <h3 className={`mb-2 text-xl font-bold transition-colors duration-300 ${isActive ? "text-purple-700 dark:text-purple-300" : "text-foreground"}`}>
          {plan.title}
        </h3>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={price}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className={`text-5xl font-black transition-colors duration-300 ${isActive ? "text-violet-600 dark:text-violet-400" : "text-foreground/90"}`}
          >
            {price}
          </motion.span>
          {price !== "$0" && (
            <span className="text-sm text-muted-foreground">/mo</span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground font-medium">{pkr}</p>
        <p className="mt-5 text-sm text-muted-foreground border-b border-border pb-6">{plan.desc}</p>
      </div>

      <ul className="flex-1 space-y-3.5 mb-8">
        {plan.features.map((feat, i) => (
          <motion.li
            key={feat}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * 0.06, duration: 0.8, ease }}
            className="flex items-start gap-3"
          >
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${isActive ? "bg-emerald-500/30" : "bg-emerald-500/20"}`}>
              <Check className="h-3 w-3 text-emerald-400" />
            </div>
            <span className={`text-sm transition-colors duration-300 ${isActive ? "text-foreground" : "text-foreground/80"}`}>{feat}</span>
          </motion.li>
        ))}
        {plan.excluded?.map((feat) => (
          <li key={feat} className="flex items-start gap-3 opacity-40">
            <X className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground line-through">{feat}</span>
          </li>
        ))}
      </ul>

      {(() => {
        let targetHref = "/register";
        if (plan.id && plan.id !== "free") {
          const billingStr = isYearly ? "yearly" : "monthly";
          const upgradeUrl = `/dashboard/upgrade?plan=${plan.id}&billing=${billingStr}`;
          targetHref = session?.user ? upgradeUrl : `/login?callbackUrl=${encodeURIComponent(upgradeUrl)}`;
        }
        return (
          <Link
            href={targetHref}
            prefetch={true}
            className={`${isActive ? "landing-button-primary" : "landing-button-secondary"} landing-button-centered w-full`}
          >
            {plan.ctaText}
          </Link>
        );
      })()}
    </motion.article>
  );
});

// ============================================================================
// TESTIMONIALS CAROUSEL
// ============================================================================
const TestimonialsMarquee = memo(function TestimonialsMarquee({
  testimonials,
}: {
  testimonials: PublicReview[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = useIsMobile(768, true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || isPaused || testimonials.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, testimonials.length]);

  if (testimonials.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-8 text-center">
        <div className="landing-glass rounded-[1.6rem] p-8 text-sm text-muted-foreground">
          Approved community reviews will appear here soon.
        </div>
      </div>
    );
  }

  const activeReview = testimonials[activeIndex % testimonials.length];

  const move = (direction: number) => {
    setActiveIndex((current) =>
      (current + direction + testimonials.length) % testimonials.length
    );
  };

  return (
    <div
      className="relative mx-auto flex min-h-[430px] w-full max-w-5xl items-center justify-center overflow-hidden px-4 py-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="absolute inset-x-0 top-1/2 mx-auto h-px max-w-3xl bg-violet-500/15" />
      <AnimatePresence mode="popLayout">
        {testimonials.map((review, index) => {
          const offset =
            (index - activeIndex + testimonials.length) % testimonials.length;
          const normalizedOffset =
            offset > testimonials.length / 2 ? offset - testimonials.length : offset;
          const isActive = normalizedOffset === 0;
          const isVisible = isMobile ? isActive : Math.abs(normalizedOffset) <= 2;
          const roleMeta = getReviewRoleMeta(review.user.role);
          const cleanedComment = cleanReviewComment(review.comment);

          if (!isVisible) return null;

          return (
            <motion.article
              key={review.id}
              drag={isActive ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) move(1);
                if (info.offset.x > 80) move(-1);
              }}
              initial={
                isMobile
                  ? { opacity: 0, scale: 0.96, y: 20, x: 0 }
                  : { opacity: 0, scale: 0.88, x: normalizedOffset * 120 }
              }
              animate={
                isMobile
                  ? {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      y: 0,
                      rotateY: 0,
                      zIndex: 20,
                    }
                  : {
                      opacity: isActive ? 1 : 0.55,
                      scale: isActive ? 1 : 0.88,
                      x: normalizedOffset * 150,
                      y: Math.abs(normalizedOffset) * 18,
                      rotateY: normalizedOffset * -12,
                      zIndex: 20 - Math.abs(normalizedOffset),
                    }
              }
              exit={{ opacity: 0, scale: 0.84 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className={`absolute flex h-[350px] w-[min(88vw,420px)] flex-col justify-between rounded-[1.8rem] border p-7 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? "border-violet-500/20 bg-white/90 text-foreground shadow-[0_32px_90px_-48px_rgba(109,40,217,.48)] backdrop-blur-xl dark:border-violet-300/15 dark:bg-[#17131f]"
                  : "border-violet-950/[0.06] bg-violet-50/55 text-foreground shadow-[0_24px_70px_-46px_rgba(76,29,149,.22)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035]"
              }`}
              aria-label={`Review from ${review.user.name}`}
              aria-hidden={!isActive}
            >
              <div>
                <motion.div
                  className="mb-5 flex gap-1 text-violet-500 dark:text-violet-300"
                  animate={!prefersReducedMotion && !isMobile && isActive ? { y: [0, -3, 0] } : { y: 0 }}
                  transition={{ duration: 4.8, repeat: Infinity, ease }}
                >
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </motion.div>
                <p className="text-base italic leading-relaxed text-slate-600 dark:text-slate-300">
                  {cleanedComment}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-xs font-bold text-white ring-2 ring-violet-500/15 dark:bg-violet-400 dark:text-violet-950">
                  {review.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.user.image}
                      alt={`${review.user.name} profile photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    review.user.initials
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {review.user.name}
                  </div>
                  <div
                    className={`text-xs ${roleMeta.label === "Mentor" ? "text-violet-600 dark:text-violet-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {roleMeta.label}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>

      <motion.div
        key={`active-${activeReview.id}`}
        className="absolute bottom-2 flex items-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {testimonials.map((review, index) => (
          <button
            key={review.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              index === activeIndex ? "w-8 bg-violet-600 dark:bg-violet-300" : "w-2 bg-violet-950/15 dark:bg-white/20"
            }`}
            aria-label={`Show review ${index + 1}`}
            aria-current={index === activeIndex}
          />
        ))}
      </motion.div>

      <button
        type="button"
        onClick={() => move(-1)}
        className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-violet-950/10 bg-white/75 text-[0px] text-violet-700 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-1 hover:border-violet-500/30 hover:bg-violet-100 dark:border-white/10 dark:bg-white/[0.055] dark:text-violet-300 dark:hover:bg-violet-400/10 md:flex"
        aria-label="Previous testimonial"
      >
        <ArrowRight className="h-4 w-4 rotate-180" strokeWidth={1.5} aria-hidden="true" />
        ‹
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-violet-950/10 bg-white/75 text-[0px] text-violet-700 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 hover:border-violet-500/30 hover:bg-violet-100 dark:border-white/10 dark:bg-white/[0.055] dark:text-violet-300 dark:hover:bg-violet-400/10 md:flex"
        aria-label="Next testimonial"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        ›
      </button>
    </div>
  );
});

// ============================================================================
// MAIN
// ============================================================================
export default function Home() {
  const { data: session } = useSession();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile(768, true);
  const [isYearly, setIsYearly] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(fallbackPricingPlans);
  const [testimonials, setTestimonials] = useState<PublicReview[]>([]);
  const backgroundMouseX = useMotionValue(0);
  const backgroundMouseY = useMotionValue(0);
  const backgroundFrameRef = useRef<number | null>(null);
  const latestBackgroundPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;

    async function fetchReviews() {
      const response = await fetch("/api/reviews/public", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (active && response.ok && Array.isArray(data?.reviews)) {
        setTestimonials(data.reviews);
      }
    }

    void fetchReviews();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchPricingPlans() {
      const response = await fetch("/api/subscription-plans", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!active || !response.ok || !Array.isArray(data?.plans)) return;

      setPricingPlans(
        data.plans.map((plan: any) => ({
          id: plan.id,
          title: `${plan.name} Plan`,
          monthlyPrice: plan.displayPrice,
          yearlyPrice: formatPlanPrice(calculateYearlyPrice(Number(plan.price || 0))),
          monthlyPkr: Number(plan.price || 0) === 0 ? "Free Forever" : "Billed monthly",
          yearlyPkr:
            Number(plan.price || 0) === 0
              ? "Free Forever"
              : `Billed $${getYearlyTotal(Number(plan.price || 0)).toFixed(2)}/year`,
          desc: String(plan.description || ""),
          highlight: Boolean(plan.featured),
          ctaText: String(plan.cta || "Join Free"),
          features: Array.isArray(plan.features) ? plan.features.map(String) : [],
          rawMonthlyPrice: Number(plan.price || 0),
        }))
      );
    }

    void fetchPricingPlans();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;
    const onMove = (event: PointerEvent) => {
      latestBackgroundPointer.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 60,
        y: (event.clientY / window.innerHeight - 0.5) * 40,
      };
      if (backgroundFrameRef.current !== null) return;
      backgroundFrameRef.current = window.requestAnimationFrame(() => {
        backgroundMouseX.set(latestBackgroundPointer.current.x);
        backgroundMouseY.set(latestBackgroundPointer.current.y);
        backgroundFrameRef.current = null;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (backgroundFrameRef.current !== null) window.cancelAnimationFrame(backgroundFrameRef.current);
    };
  }, [backgroundMouseX, backgroundMouseY, isMobile, prefersReducedMotion]);

  const springX = useSpring(backgroundMouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(backgroundMouseY, { stiffness: 40, damping: 20 });

  return (
    <div className="landing-page relative min-h-screen w-full overflow-x-hidden">

      {/* ── BACKGROUND ORBS — liquid floating effect ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--landing-canvas)]" />
        {!isMobile && !prefersReducedMotion && (
          <>
            <motion.div
              className="absolute left-1/4 top-0 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-purple-600/[0.08] blur-[140px]"
              style={{ x: springX, y: springY }}
              animate={{ y: [0, -28, 6, 0], scale: [1, 1.08, 1.02, 1], rotate: [0, 4, -2, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: liquidEase }}
            />
            <motion.div
              className="absolute right-1/4 top-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-fuchsia-600/[0.07] blur-[140px]"
              animate={{ y: [0, -34, 8, 0], x: [0, 18, -10, 0], scale: [1, 1.12, 1.04, 1], rotate: [0, -5, 3, 0], opacity: [0.07, 0.12, 0.08, 0.07] }}
              transition={{ duration: 19, repeat: Infinity, ease: liquidEase, delay: 1.2 }}
            />
            <motion.div
              className="absolute left-1/2 bottom-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[120px]"
              animate={{ y: [0, -24, 10, 0], x: [0, -16, 8, 0], scale: [1, 1.14, 1.05, 1], rotate: [0, 6, -3, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: liquidEase, delay: 2.5 }}
            />
            <FloatingParticles />
          </>
        )}
      </div>

      {/* ══════════════ HERO — Cinematic Dark Section ══════════════ */}
      <HeroSection />

      {/* Stats — sits just below the hero, uses existing page theme */}
      <motion.section
        className="relative w-full px-4 py-24 sm:px-6 md:py-32 lg:px-8"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        <CinematicLayer className="mx-auto max-w-5xl" intensity={0.8} dim={false}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => <StatCard key={i} {...s} index={i} />)}
          </div>
        </CinematicLayer>
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ PROBLEM ══════════════ */}
      <motion.section
        className="relative w-full overflow-x-hidden px-4 py-24 sm:px-6 md:py-36"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        {/* Subtle animated grid */}
        <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <SectionBadge color="border-red-500/30 bg-red-500/10 text-red-400" icon={Flame} label="The Old Way" />
            <SectionHeading className="mb-4">Sound Familiar?</SectionHeading>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.25, ease }}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Traditional studying is broken. These are the three biggest traps students fall into.
            </motion.p>
          </div>
          <motion.div
            className="grid gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fluidParent}
          >
            {[
              { icon: Sparkles, title: "Scattered Materials", desc: "Notes across 5 apps, PDFs in random folders, and that one lecture recording you can never find when you need it." },
              { icon: Users,    title: "Studying Alone",      desc: "No study group, no accountability partner, and no one to explain concepts you don't understand at 2 AM." },
              { icon: Flame,    title: "Burnout & Overwhelm", desc: "Cramming at midnight, missing deadlines, and the constant feeling that you're falling behind every single day." },
            ].map((p, i) => (
              <motion.div
                key={i}
                variants={fluidChild}
                whileHover={{ y: -8, scale: 1.02 }}
                className="landing-glass h-full rounded-[1.7rem] p-7 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-red-500/20"
              >
                <motion.div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-red-500/40 bg-red-500/10"
                  whileHover={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 0.5 }}
                >
                  <p.icon className="h-5 w-5 text-red-400" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ FEATURES ══════════════ */}
      <motion.section
        id="features"
        className="relative w-full overflow-x-hidden px-4 py-24 sm:px-6 md:py-36"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <SectionBadge color="border-purple-500/30 bg-purple-500/10 text-purple-400" icon={Zap} label="Core Features" />
            <SectionHeading className="mb-4">Everything You Need to Succeed</SectionHeading>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.25, ease }}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Nine powerful modules working together so you never study the hard way again.
            </motion.p>
          </div>
          {/* Staggered fluid grid — parent drives children stagger, behind scroll-depth */}
          <CinematicLayer intensity={0.7} dim={false}>
            <motion.div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fluidParent}
            >
              {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
            </motion.div>
          </CinematicLayer>
        </div>
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ WORKFLOW ══════════════ */}
      <motion.section
        id="workflow"
        className="relative w-full overflow-x-hidden border-y border-black/[0.06] bg-black/[0.018] px-4 py-24 dark:border-white/[0.07] dark:bg-white/[0.018] sm:px-6 md:py-36"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        {!isMobile && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet-500/[0.05] blur-[100px]"
            animate={{ scale: [1, 1.18, 1], opacity: [0.05, 0.09, 0.05] }}
            transition={{ duration: 8, repeat: Infinity, ease: liquidEase }}
          />
        )}
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <SectionBadge color="border-violet-500/30 bg-violet-500/10 text-violet-400" icon={Target} label="How It Works" />
            <SectionHeading className="mb-4">A Ritual Built For Deep Work</SectionHeading>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Three simple steps. One powerful system. Focus on what matters.
            </motion.p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Steps */}
            <div className="space-y-8">
              {workflow.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 }}
                  className="flex gap-5 group"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 font-mono text-sm font-bold text-purple-400 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-purple-500/50 group-hover:bg-purple-500/25"
                      whileHover={{ scale: 1.15, rotate: 6 }}
                    >
                      {step.step}
                    </motion.div>
                    {i < workflow.length - 1 && (
                      <motion.div
                        className="mt-2 h-full w-px"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.15 + 0.4, ease }}
                        style={{ background: "#7C3AED", transformOrigin: "top" }}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <h3 className="text-xl font-bold text-foreground mb-1 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Timer mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
              whileHover={{ y: -6 }}
              className="landing-glass rounded-[1.9rem] p-8"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-3 w-3 rounded-full bg-emerald-500"
                    animate={isMobile || prefersReducedMotion ? undefined : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ boxShadow: "0 0 10px rgba(16,185,129,0.6)" }}
                  />
                  <span className="text-sm font-bold text-foreground/80">Focus Mode Active</span>
                </div>
                <span className="rounded-lg bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Session 2 / 4</span>
              </div>

              {/* Animated ring */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" strokeWidth="7" className="fill-none stroke-foreground/[0.06]" />
                    <motion.circle
                      cx="100" cy="100" r="85" strokeWidth="7" strokeLinecap="round"
                      className="fill-none stroke-purple-500"
                      strokeDasharray="534"
                      initial={{ strokeDashoffset: 534 }}
                      whileInView={{ strokeDashoffset: 181 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease, delay: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold font-mono text-foreground tracking-wider">25:00</span>
                    <span className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest">remaining</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-xl bg-purple-500/[0.08] border border-purple-500/20 p-5">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400">Current Task</div>
                <div className="text-xl font-bold text-foreground">Data Structures Review</div>
                <div className="mt-1 text-sm text-muted-foreground">Binary Trees &amp; Graphs</div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Session Progress</span>
                  <motion.span
                    className="text-purple-400"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    transition={{ delay: 1.1 }}
                  >66%</motion.span>
                </div>
                <AnimatedProgressBar pct={66} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: "7d",  label: "Streak", color: "text-yellow-500 dark:text-yellow-400" },
                  { val: "12",  label: "Notes",  color: "text-purple-500 dark:text-purple-400" },
                  { val: "94",  label: "XP",     color: "text-foreground/90" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.75 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9 + i * 0.1, type: "spring", stiffness: 280 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="rounded-xl bg-muted/50 border border-border p-4 text-center hover:border-purple-500/20 transition-colors duration-300"
                  >
                    <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <motion.section
        className="relative w-full overflow-x-hidden py-24 md:py-36"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <SectionBadge color="border-yellow-500/30 bg-yellow-500/10 text-yellow-400" icon={Star} label="Reviews" />
            <SectionHeading>Loved by Students and Mentors</SectionHeading>
          </div>
        </div>
        <TestimonialsMarquee testimonials={testimonials} />
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ PRICING ══════════════ */}
      <motion.section
        id="pricing"
        className="relative w-full overflow-x-hidden border-y border-black/[0.06] bg-black/[0.018] px-4 py-24 dark:border-white/[0.07] dark:bg-white/[0.018] sm:px-6 md:py-36"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
      >
        {!isMobile && !prefersReducedMotion && (
          <motion.div
            className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-fuchsia-500/[0.05] blur-[100px]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: liquidEase }}
          />
        )}
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <SectionHeading className="mb-6">Invest In Your Grades</SectionHeading>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.25, ease }}
              className="flex items-center justify-center gap-4 text-sm font-bold"
            >
              <span className={!isYearly ? "text-foreground" : "text-muted-foreground"}>Monthly</span>
              <button
                onClick={() => setIsYearly(v => !v)}
                className="relative w-14 h-7 rounded-lg bg-muted border border-border flex items-center p-1 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                aria-label={isYearly ? "Switch to monthly billing" : "Switch to annual billing"}
                aria-pressed={isYearly}
              >
                <motion.div
                  className="w-5 h-5 rounded-md bg-purple-500 shadow-lg shadow-purple-500/30"
                  animate={{ x: isYearly ? 26 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`flex items-center gap-2 ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Annually
                <motion.span
                  animate={isYearly ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
                >
                  Save 20%
                </motion.span>
              </span>
            </motion.div>
          </div>
          <CinematicLayer intensity={0.7} dim={false}>
            <motion.div
              className="grid gap-6 lg:grid-cols-3 items-stretch"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fluidParent}
            >
              {pricingPlans.map((plan, i) => (
                <PricingCard key={plan.title} plan={plan} isYearly={isYearly} index={i} session={session} />
              ))}
            </motion.div>
          </CinematicLayer>
        </div>
      </motion.section>

      <AnimatedDivider />

      {/* ══════════════ FINAL CTA — Premium Immersive ══════════════ */}
      <PremiumFinalCTA />
    </div>
  );
}
