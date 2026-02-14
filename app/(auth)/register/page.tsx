"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Sparkles, Eye, EyeOff, User } from "lucide-react";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16 overflow-hidden">
      
      {/* Animated Background Glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.2, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group"
      >
        <motion.div
          whileHover={{ x: -4 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.div>
        Back to Home
      </Link>

      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="w-full max-w-md"
      >
        {/* Header Section */}
        <motion.div
          variants={fadeInUp}
          className="mb-8 text-center"
        >
          {/* Animated Icon */}
          <motion.div
            variants={scaleIn}
            className="mb-6 inline-flex"
          >
            <motion.div
              className="relative"
              whileHover={prefersReducedMotion ? {} : { 
                rotate: [0, -10, 10, -10, 0],
                scale: 1.05
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 to-primary/10 p-5 backdrop-blur-xl border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary" strokeWidth={2} />
              </div>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4"
          >
            Start the Ritual
          </motion.p>
          
          <motion.h1
            variants={fadeInUp}
            className="text-4xl font-black tracking-tight sm:text-5xl mb-3"
          >
            Create Your{" "}
            <span className="text-primary">
              StudyBuddy
            </span>
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            className="text-base text-muted-foreground max-w-sm mx-auto"
          >
            Join thousands of scholars on their journey to academic excellence
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 to-card/50 p-8 backdrop-blur-xl shadow-2xl"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <form className="relative space-y-6">
            {/* Name Input */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-bold text-foreground mb-2">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-4 py-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background placeholder:text-muted-foreground/50"
                />
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-bold text-foreground mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  placeholder="scholar@studybuddy.com"
                  className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-4 py-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background placeholder:text-muted-foreground/50"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-bold text-foreground mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-12 py-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={2} />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={fadeInUp}>
              <motion.button
                type="submit"
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                className="group relative w-full overflow-hidden rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                <span className="relative flex items-center justify-center gap-2">
                  Join the Cohort
                  <motion.div
                    animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-5 w-5" strokeWidth={2} />
                  </motion.div>
                </span>
              </motion.button>
            </motion.div>

            {/* Terms */}
            <motion.div variants={fadeInUp}>
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline font-semibold">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline font-semibold">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div variants={fadeInUp} className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-semibold">
                  Already a Scholar?
                </span>
              </div>
            </motion.div>

            {/* Login Link */}
            <motion.div variants={fadeInUp} className="text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group"
              >
                Sign in to your account
                <motion.div
                  animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" strokeWidth={2} />
                </motion.div>
              </Link>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </main>
  );
}