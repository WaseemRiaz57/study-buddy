"use client";

import { motion, useReducedMotion, Variants, useInView } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, 
  Globe, 
  Shield, 
  LucideIcon, 
  Sparkles,
  Users,
  BookOpen,
  Video,
  MessageSquare,
  Brain,
  Clock
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface WorkflowStep {
  step: string;
  title: string;
  detail: string;
}

// ============================================================================
// DATA
// ============================================================================

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI Content Generator",
    description: "Transform study materials into notes, summaries, and quizzes automatically.",
  },
  {
    icon: Users,
    title: "Study With Buddy",
    description: "Connect with peers who share your learning goals and study together.",
  },
  {
    icon: Video,
    title: "Mentorship System",
    description: "Book free sessions with expert mentors for personalized guidance.",
  },
  {
    icon: Clock,
    title: "Focus Room",
    description: "Distraction-free environment with Pomodoro technique for productivity.",
  },
  {
    icon: Globe,
    title: "Study Rooms",
    description: "Virtual collaborative spaces for group learning and real-time discussion.",
  },
  {
    icon: MessageSquare,
    title: "Community Forums",
    description: "Share knowledge, ask questions, and engage with learning community.",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    description: "Access and share quality study materials created by the community.",
  },
  {
    icon: Shield,
    title: "Admin Dashboard",
    description: "Comprehensive platform management and user moderation tools.",
  },
  {
    icon: Sparkles,
    title: "Gamification",
    description: "Track progress with XP, levels, badges, and achievement system.",
  },
];

const workflow: WorkflowStep[] = [
  {
    step: "01",
    title: "Set the ritual",
    detail: "Pick a duration, mood, and focus goal to anchor each session.",
  },
  {
    step: "02",
    title: "Enter the room",
    detail: "Drop into a guided environment built for the task in front of you.",
  },
  {
    step: "03",
    title: "Close the loop",
    detail: "Reflect, capture outcomes, and queue the next milestone.",
  },
];

const launchKitFeatures = [
  "Guided onboarding ritual",
  "Personal focus playlist",
  "Weekly insight recap",
  "AI-powered study recommendations",
];

const stats = [
  { value: "50K+", label: "Active Scholars" },
  { value: "1M+", label: "Study Hours" },
  { value: "98%", label: "Success Rate" },
  { value: "4.9/5", label: "User Rating" },
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
};

const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

const BackgroundGlow = memo(function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <motion.div 
          className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.25, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute right-1/4 top-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.2, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute left-1/2 bottom-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" aria-hidden="true" />
    </>
  );
});

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard = memo(function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeInUp}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: prefersReducedMotion ? 0 : index * 0.08,
      }}
      whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.02 }}
      className="group relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/90 to-card/50 p-8 backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <motion.div 
          className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 transition-all group-hover:scale-110 group-hover:from-primary/30 group-hover:to-primary/10"
          whileHover={prefersReducedMotion ? {} : {
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        </motion.div>
        <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
        <p className="text-base leading-relaxed text-muted-foreground">{feature.description}</p>
      </div>
    </motion.div>
  );
});

interface WorkflowCardProps {
  item: WorkflowStep;
}

const WorkflowCard = memo(function WorkflowCard({ item }: WorkflowCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={prefersReducedMotion ? {} : { x: 12 }}
      className="group flex gap-6 transition-all"
    >
      <div className="flex-shrink-0">
        <motion.div 
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 font-mono text-base font-bold text-primary shadow-lg shadow-primary/10 transition-all group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/20"
          whileHover={prefersReducedMotion ? {} : {
            rotate: [0, -5, 5, 0],
          }}
          transition={{ duration: 0.5 }}
        >
          {item.step}
        </motion.div>
      </div>
      <div className="flex-1 pb-10">
        <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
        <p className="text-base leading-relaxed text-muted-foreground">{item.detail}</p>
      </div>
    </motion.div>
  );
});

const StatCard = memo(function StatCard({ value, label, index }: { value: string; label: string; index: number }) {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Extract number from value (e.g., "50K+" -> 50)
  const getTargetNumber = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return num;
  };

  // Get suffix (e.g., "K+", "M+", "%", "/5")
  const getSuffix = (val: string) => {
    return val.replace(/[0-9.]/g, '');
  };

  const targetNumber = getTargetNumber(value);
  const suffix = getSuffix(value);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetNumber / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetNumber) {
        setCount(targetNumber);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, targetNumber]);

  return (
    <motion.div
      ref={ref}
      variants={fadeInScale}
      transition={{
        duration: 0.5,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
      className="text-center"
    >
      <div className="mb-2 text-4xl font-bold text-primary">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <BackgroundGlow />

      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-40 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center"
          >
            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="mb-8 text-6xl font-black leading-tight tracking-tight sm:text-7xl lg:text-8xl"
            >
               Studying made social.
              <br />
              <span className="inline-block bg-gradient-to-r from-primary/100 via-primary/60 to-primary/20 bg-clip-text text-transparent">
                Success made certain.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
            >
              Where learning meets innovation. Build knowledge, connect with mentors, 
              and achieve your goals in a community that never stops growing.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-5 sm:flex-row mb-12"
            >
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Link
                  href="/session"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-10 py-5 font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-3xl hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <span className="relative">Begin a session</span>
                  <motion.div
                    animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="relative h-5 w-5" />
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 rounded-full border-2 border-border bg-card/50 px-10 py-5 font-bold text-foreground backdrop-blur-xl transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  View dashboard
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {stats.map((stat, i) => (
                <StatCard key={stat.label} {...stat} index={i} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mb-16 text-center"
          >
            <motion.h2
              id="features-heading"
              variants={fadeInUp}
              className="mb-6 text-5xl font-black tracking-tight sm:text-6xl"
            >
              Everything you need to{" "}
              <span className="text-primary">
                excel
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
            >
              Nine powerful modules designed to transform your study experience
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section
        className="relative px-4 py-24 sm:px-6 lg:px-8"
        aria-labelledby="workflow-heading"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Section Header */}
            <div className="mb-20 text-center">
              <motion.div variants={fadeInUp} className="mb-6 inline-flex">
                <span className="rounded-full bg-primary/10 px-6 py-2 text-base font-bold text-primary shadow-lg">
                  Hybrid workflow
                </span>
              </motion.div>

              <motion.h2
                id="workflow-heading"
                variants={fadeInUp}
                className="mb-6 text-5xl font-black tracking-tight sm:text-6xl"
              >
                A study ritual that adapts to{" "}
                <span className="text-primary">
                  your mind
                </span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground"
              >
                Every session blends intention setting, guided environment shifts, and reflective
                review. Your routine stays consistent while the interface adapts to the moment.
              </motion.p>
            </div>

            {/* Workflow Steps */}
            <div className="relative">
              <div
                className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"
                aria-hidden="true"
              />

              {workflow.map((item) => (
                <WorkflowCard key={item.step} item={item} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8" aria-labelledby="community-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="overflow-hidden rounded-[2rem] border-2 border-border/40 bg-gradient-to-br from-card via-card/95 to-card/80 p-12 shadow-2xl backdrop-blur-xl sm:p-16 lg:p-20"
          >
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              {/* Content */}
              <div>
                <motion.h2
                  id="community-heading"
                  variants={fadeInUp}
                  className="mb-8 text-5xl font-black tracking-tight sm:text-6xl"
                >
                  Build momentum{" "}
                  <span className="text-primary">
                    together
                  </span>
                </motion.h2>

                <motion.p
                  variants={fadeInUp}
                  className="mb-10 text-xl leading-relaxed text-muted-foreground"
                >
                  Join mentor circles, live focus sessions, and accountability pods that match your
                  learning style. StudyBuddy keeps the energy calm and the progress visible.
                </motion.p>

                <motion.div variants={fadeInUp}>
                  <motion.div
                    whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/signup"
                      className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-foreground px-10 py-5 font-bold text-background shadow-2xl transition-all hover:shadow-3xl focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-card"
                    >
                      <span className="relative">Claim your seat</span>
                      <motion.div
                        animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="relative h-5 w-5" />
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>

              {/* Launch Kit Features */}
              <div>
                <motion.h3
                  variants={fadeInUp}
                  className="mb-8 text-sm font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Launch kit features
                </motion.h3>

                <motion.ul
                  variants={staggerContainer}
                  className="space-y-5"
                  role="list"
                  aria-label="Launch kit features"
                >
                  {launchKitFeatures.map((text, i) => (
                    <motion.li
                      key={i}
                      variants={fadeInUp}
                      className="flex items-start gap-4 group"
                    >
                      <motion.div
                        className="mt-1.5 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 p-2 transition-transform group-hover:scale-110"
                        aria-hidden="true"
                        whileHover={prefersReducedMotion ? {} : {
                          rotate: 360,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </motion.div>
                      <span className="text-lg leading-relaxed text-foreground font-medium">{text}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-8 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl"
            >
              Ready to transform your{" "}
              <span className="text-primary">
                study journey?
              </span>
            </motion.h2>
            
            <motion.p
              variants={fadeInUp}
              className="mb-12 text-xl text-muted-foreground"
            >
              Join thousands of scholars already achieving their goals
            </motion.p>

            <motion.div variants={fadeInUp}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-12 py-6 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-3xl hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <span className="relative">Get started for free</span>
                  <motion.div
                    className="relative"
                    animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}