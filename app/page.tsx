"use client";

import {
  motion,
  useReducedMotion,
  useInView,
  useSpring,
  AnimatePresence,
  Variants,
} from "framer-motion";
import Image from "next/image";
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
import { Reveal } from "@/components/landing/Reveal";
import { PRICING_PLANS } from "@/lib/pricingConfig";

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
  const isMentor = normalizedRole === "teacher" || normalizedRole === "mentor";

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
  { icon: Store,        title: "Mentor Marketplace",   description: "Find expert tutors or sell your own high-quality study materials.", glow: "emerald", badge: "New", badgeColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
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
  title: `${plan.name} Plan`,
  monthlyPrice: plan.displayPrice,
  yearlyPrice: plan.price === 0 ? "$0" : `$${Math.round(plan.price * 10) / 10}`,
  monthlyPkr: plan.price === 0 ? "Free Forever" : "Billed monthly",
  yearlyPkr: plan.price === 0 ? "Free Forever" : "Annual billing available",
  desc: plan.description,
  highlight: plan.featured,
  ctaText: plan.cta,
  features: plan.features,
}));

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

// Liquid cubic-bezier — fast start, gentle settle
const ease = [0.16, 1, 0.3, 1] as const;

// Standard liquid reveal: fades up with fluid easing
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

// Stagger parent — drives staggerChildren for section grids
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
};

// Children variant used inside staggered grids (Features, Hero text, CTA)
const fluidChild: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
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
  const isMobile = useIsMobile();

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
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
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
// ANIMATED SECTION HEADING (word by word)
// ============================================================================
function SectionHeading({ children, className = "" }: { children: string; className?: string }) {
  const words = children.split(" ");
  return (
    <motion.h2
      className={`text-4xl md:text-5xl font-bold text-foreground ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={stagger}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={fadeUp}
          className="inline-block mr-[0.28em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
}

// ============================================================================
// FADE-OUT GRADIENT TEXT
// ============================================================================
function FadeOutGradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-gradient-to-r from-purple-700 to-purple-300 bg-clip-text text-transparent"
    >
      {children}
    </span>
  );
}

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
      className="mx-auto h-px w-full max-w-2xl bg-[#7C3AED]   "
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
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 2000 / steps);
    return () => clearInterval(t);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
      whileHover={{ y: -6, scale: 1.04 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/50 p-6 md:p-8
                 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/[0.05] transition-all duration-300"
    >
      <motion.div
        className="mb-3 rounded-xl bg-purple-500/10 p-3"
        whileHover={{ rotate: [0, -12, 12, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="h-5 w-5 text-purple-400" />
      </motion.div>
      <div className="mb-1 text-3xl md:text-4xl font-black text-foreground tabular-nums drop-shadow-lg">
        {count}{suffix}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground drop-shadow-md">{label}</div>
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
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-7
                 hover:border-foreground/20 hover:bg-card hover:shadow-xl hover:shadow-purple-500/[0.05]
                 transition-colors duration-300 cursor-pointer"
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
        transition={{ duration: 0.55, ease: "easeInOut" }}
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
        className={`h-full rounded-full bg-[#7C3AED] ${color}`}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.3, ease, delay: 0.35 }}
      />
    </div>
  );
}

// ============================================================================
// PRICING CARD
// ============================================================================
const PricingCard = memo(function PricingCard({
  plan, isYearly, index, isMobile,
}: { plan: PricingPlan; isYearly: boolean; index: number; isMobile: boolean }) {
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
      className={`relative flex flex-col rounded-2xl border p-8 h-full cursor-pointer transition-all duration-300 ${
        plan.highlight
          ? "border-purple-500/60 bg-purple-50 dark:bg-purple-950/20 shadow-[0_0_50px_rgba(140,48,232,0.18)]"
          : hovered
          ? "border-purple-400/50 bg-purple-50/40 dark:bg-purple-950/10 shadow-[0_0_35px_rgba(140,48,232,0.10)]"
          : "border-border bg-card/50"
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
            <span className="text-sm text-muted-foreground">/{isYearly ? "yr" : "mo"}</span>
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

      <Link
        href="/register"
        prefetch={true}
        className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all duration-300 ${
          isActive
            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 hover:shadow-xl"
            : "border border-border bg-card text-foreground hover:bg-muted"
        }`}
      >
        {plan.ctaText}
      </Link>
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
  const isMobile = useIsMobile();

  if (testimonials.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-8 text-center">
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-sm text-muted-foreground">
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
    <div className="relative mx-auto flex min-h-[430px] w-full max-w-5xl items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-x-0 top-1/2 mx-auto h-px max-w-3xl bg-[#7C3AED]/20" />
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
              className={`absolute flex h-[350px] w-[min(88vw,420px)] flex-col justify-between rounded-3xl border p-7 shadow-2xl ${
                isActive
                  ? "border-violet-400/40 bg-violet-700 text-white shadow-violet-700/30"
                  : "border-border bg-card/70 text-foreground shadow-black/5 backdrop-blur-xl"
              }`}
              aria-label={`Review from ${review.user.name}`}
            >
              <div>
                <div className="mb-5 flex gap-1 text-yellow-300">
                  {Array.from({ length: Math.max(1, Math.min(5, review.rating)) }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <p
                  className={`text-base italic leading-relaxed ${
                    isActive ? "text-white/90" : "text-muted-foreground"
                  }`}
                >
                  {cleanedComment}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white ring-2 ring-white/20">
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
                  <div className={isActive ? "text-sm font-bold text-white" : "text-sm font-bold text-foreground"}>
                    {review.user.name}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive
                        ? roleMeta.className
                        : roleMeta.label === "Mentor"
                          ? "text-[#7C3AED]"
                          : "text-gray-500 dark:text-gray-400"
                    }`}
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
            className={`h-2 rounded-md transition-all ${
              index === activeIndex ? "w-8 bg-[#7C3AED]" : "w-2 bg-muted-foreground/30"
            }`}
            aria-label={`Show review ${index + 1}`}
            aria-current={index === activeIndex}
          />
        ))}
      </motion.div>

      <button
        type="button"
        onClick={() => move(-1)}
        className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background/80 font-bold text-[#7C3AED] shadow-lg backdrop-blur transition-colors hover:bg-[#7C3AED] hover:text-white md:flex"
        aria-label="Previous testimonial"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background/80 font-bold text-[#7C3AED] shadow-lg backdrop-blur transition-colors hover:bg-[#7C3AED] hover:text-white md:flex"
        aria-label="Next testimonial"
      >
        ›
      </button>
    </div>
  );
});

// ============================================================================
// MAIN
// ============================================================================
export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [isYearly, setIsYearly] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(fallbackPricingPlans);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [testimonials, setTestimonials] = useState<PublicReview[]>([]);

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
          title: `${plan.name} Plan`,
          monthlyPrice: plan.displayPrice,
          yearlyPrice:
            Number(plan.price || 0) === 0
              ? "$0"
              : `$${Math.round(Number(plan.price || 0) * 10) / 10}`,
          monthlyPkr: Number(plan.price || 0) === 0 ? "Free Forever" : "Billed monthly",
          yearlyPkr:
            Number(plan.price || 0) === 0
              ? "Free Forever"
              : "Annual billing available",
          desc: String(plan.description || ""),
          highlight: Boolean(plan.featured),
          ctaText: String(plan.cta || "Join Free"),
          features: Array.isArray(plan.features) ? plan.features.map(String) : [],
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
    const onMove = (e: MouseEvent) => setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile, prefersReducedMotion]);

  const springX = useSpring(mousePos.x * 30, { stiffness: 40, damping: 20 });
  const springY = useSpring(mousePos.y * 20, { stiffness: 40, damping: 20 });

  return (
    <div className="landing-page relative min-h-screen w-full overflow-x-hidden bg-background text-foreground font-sans">

      {/* ── BACKGROUND ORBS — liquid floating effect ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <motion.div
          className="absolute left-1/4 top-0 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-purple-600/[0.08] blur-[140px]"
          style={{ x: springX, y: springY }}
          animate={{ y: [0, -15, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-1/4 top-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-fuchsia-600/[0.07] blur-[140px]"
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1], opacity: [0.07, 0.11, 0.07] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        <motion.div
          className="absolute left-1/2 bottom-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[120px]"
          animate={{ y: [0, -15, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <FloatingParticles />
      </div>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative flex min-h-[80vh] w-full flex-col justify-center overflow-x-hidden px-4 py-24 text-center sm:px-6 lg:px-8">
        {/* Hero background image — liquid floating */}
        <motion.div
          className="absolute inset-0"
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        >
          <Image
            src="/hero.png"
            alt="StudyBuddy Hero Image"
            fill
            priority={true}
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] dark:bg-slate-950/60" />

        {/* Hero content — staggered fluid reveal */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fluidParent}
          className="relative z-10 mx-auto max-w-5xl"
        >

          {/* Headline — 3D flip-in per word */}
          <motion.h1
            className="mb-8 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 drop-shadow-lg dark:text-white sm:text-5xl lg:text-7xl"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.span className="block" variants={stagger}>
              {["Studying", "made", "social."].map((w, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 60, rotateX: -25 },
                    show:   { opacity: 1, y: 0,  rotateX: 0, transition: { duration: 0.8, ease } },
                  }}
                  className="inline-block mr-[0.22em] last:mr-0"
                  style={{ display: "inline-block" }}
                >
                  {w}
                </motion.span>
              ))}
            </motion.span>
            <motion.span
              className="block"
              variants={{
                hidden: { opacity: 0, y: 60 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease, delay: 0.38 } },
              }}
            >
              <FadeOutGradientText>Success made certain.</FadeOutGradientText>
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fluidChild}
            className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-700 drop-shadow-md dark:text-slate-300 md:text-xl"
          >
            Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
          </motion.p>

          <motion.div variants={fluidChild} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-purple-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-purple-600/25 transition-all hover:bg-purple-700 hover:shadow-2xl hover:shadow-purple-600/35"
              >
                Begin a session
                <motion.span className="inline-flex" animate={isMobile ? { y: [0, 3, 0] } : { x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 px-10 py-4 text-base font-bold text-slate-900 transition-all hover:border-foreground/20 hover:bg-muted dark:text-foreground"
              >
                View dashboard
              </Link>
            </motion.div>
          </motion.div>

          <motion.p variants={fluidChild} className="mt-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
            No credit card required&nbsp;&bull;&nbsp;Free forever plan
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="relative z-10 mt-16 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          <motion.div
            className="flex flex-col items-center gap-1"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-8 w-[1px] bg-[#7C3AED]  " />
            <div className="h-1 w-1 rounded-full bg-purple-400/40" />
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => <StatCard key={i} {...s} index={i} />)}
          </div>
        </div>
      </section>

      <AnimatedDivider />

      {/* ══════════════ PROBLEM ══════════════ */}
      <section className="relative w-full overflow-x-hidden px-6 py-28">
        {/* Subtle animated grid */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "none",
            backgroundSize: "60px 60px",
          }}
          animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
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
                className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-7 hover:border-red-500/25 hover:shadow-lg hover:shadow-red-500/[0.04] transition-all duration-300 h-full"
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
      </section>

      <AnimatedDivider />

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" className="relative w-full overflow-x-hidden px-6 py-28">
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
          {/* Staggered fluid grid — parent drives children stagger */}
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fluidParent}
          >
            {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
          </motion.div>
        </div>
      </section>

      <AnimatedDivider />

      {/* ══════════════ WORKFLOW ══════════════ */}
      <section id="workflow" className="relative w-full overflow-x-hidden px-6 py-28 bg-muted/40 border-y border-border">
        <motion.div
          className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet-500/[0.05] blur-[100px]"
          animate={{ scale: [1, 1.18, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
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
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-sm font-bold transition-all duration-300 group-hover:bg-purple-500/25 group-hover:border-purple-500/50"
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
              className="rounded-[1.75rem] border border-border bg-card/60 p-8 shadow-2xl shadow-purple-500/[0.06] backdrop-blur-sm"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-3 w-3 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
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
      </section>

      <AnimatedDivider />

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="relative w-full overflow-x-hidden py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <SectionBadge color="border-yellow-500/30 bg-yellow-500/10 text-yellow-400" icon={Star} label="Reviews" />
            <SectionHeading>Loved by Students and Mentors</SectionHeading>
          </div>
        </div>
        <TestimonialsMarquee testimonials={testimonials} />
      </section>

      <AnimatedDivider />

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" className="relative w-full overflow-x-hidden px-6 py-28 bg-muted/40 border-y border-border">
        <motion.div
          className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-fuchsia-500/[0.05] blur-[100px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
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
          <motion.div
            className="grid gap-6 lg:grid-cols-3 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fluidParent}
          >
            {pricingPlans.map((plan, i) => (
              <PricingCard key={plan.title} plan={plan} isYearly={isYearly} index={i} isMobile={isMobile} />
            ))}
          </motion.div>
        </div>
      </section>

      <AnimatedDivider />

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="relative w-full overflow-x-hidden px-6 py-36 text-center">
        {/* Breathing glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[400px] w-[700px] rounded-full bg-purple-500/[0.06] blur-[120px]" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fluidParent}
          className="mx-auto max-w-3xl relative"
        >
          <motion.div variants={fluidChild} className="mb-4">
            <SectionBadge color="border-purple-500/30 bg-purple-500/10 text-purple-400" icon={Sparkles} label="Get Started Free" />
          </motion.div>

          {/* CTA heading word by word */}
          <motion.h2 className="mb-6 text-5xl md:text-6xl font-black leading-[1.1]" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={stagger}>
            {["Stop", "Procrastinating."].map((w, i) => (
              <motion.span key={i} variants={fadeUp} className="inline-block mr-3">{w}</motion.span>
            ))}
            <br />
            {["Start", "Achieving."].map((w, i) => (
              <motion.span key={i} variants={fadeUp} className="inline-block mr-3 text-[#7C3AED]">
                {w}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p variants={fluidChild} className="mb-10 text-lg text-muted-foreground">
            Join the smartest study community today. Setup takes less than 60 seconds.
          </motion.p>

          <motion.div variants={fluidChild}>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Link href="/register"
                className="inline-flex items-center gap-3 rounded-lg bg-foreground px-10 py-4 text-lg font-bold text-background shadow-[0_0_50px_rgba(0,0,0,0.12)] dark:shadow-[0_0_50px_rgba(255,255,255,0.12)] hover:shadow-2xl transition-shadow"
              >
                Create Free Account
                <motion.span className="inline-flex" animate={isMobile ? { y: [0, 3, 0] } : { x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </Link>
            </motion.div>
            <p className="mt-5 text-sm font-medium text-muted-foreground">
              Free forever plan&nbsp;&bull;&nbsp;No credit card required
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

