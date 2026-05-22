"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import BackButton from "@/components/ui/BackButton";

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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // 🔴 Google Login Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  // 📧 Email/Password Login Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Ab backend se aane wala asli error show hoga
        setError(result.error);
      } else if (result?.ok) {
        const session = await getSession();
        const role = String(session?.user?.role || "").toUpperCase();

        router.push(role === "ADMIN" ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page min-h-screen w-full flex bg-background text-foreground lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full w-full bg-muted lg:block">
        <Image
          src="/login.png"
          alt="Login Focus"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/20" />
      </div>

      <section className="relative flex w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-8 lg:p-12">
      
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

      <BackButton
        href="/"
        label="Back to home"
        className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8"
      />

      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="w-full max-w-md"
      >
        {/* Header Section */}
        <motion.header variants={fadeInUp} className="mb-8 text-center">
          <motion.div variants={scaleIn} className="mb-6 inline-flex">
            <motion.div
              className="relative"
              whileHover={prefersReducedMotion ? {} : { 
                rotate: [0, -10, 10, -10, 0],
                scale: 1.05
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
              <div className="relative flex items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 backdrop-blur-xl">
                <BrandLogo size="lockup" />
                <span className="text-2xl font-black tracking-tight text-[#7C3AED]">
                  StudyBuddy
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4"
          >
            Welcome Back, Scholar
          </motion.p>
          
          <motion.h1
            variants={fadeInUp}
            className="text-4xl font-black tracking-tight sm:text-5xl mb-3"
          >
            Enter Your{" "}
            <span className="text-primary">
              Focus Space
            </span>
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            className="text-base text-muted-foreground max-w-sm mx-auto"
          >
            Resume your learning journey and reconnect with your study community
          </motion.p>
        </motion.header>

        {/* Form Card */}
        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-5 backdrop-blur-xl shadow-2xl sm:p-8"
        >
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

          <form className="relative space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </motion.div>
            )}

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
                  required
                  placeholder="scholar@studybuddy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-4 py-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div variants={fadeInUp}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-foreground">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-12 py-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={2} />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={fadeInUp}>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={prefersReducedMotion || isLoading ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion || isLoading ? {} : { scale: 0.98 }}
                className="group relative w-full overflow-hidden rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Enter StudyBuddy
                      <motion.div
                        animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowLeft className="h-5 w-5 rotate-180" strokeWidth={2} />
                      </motion.div>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>

            {/* Divider for Social Login */}
            <motion.div variants={fadeInUp} className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-semibold">
                  Or continue with
                </span>
              </div>
            </motion.div>

            {/* Google Login Button */}
            <motion.div variants={fadeInUp}>
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                whileHover={prefersReducedMotion || isLoading ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion || isLoading ? {} : { scale: 0.98 }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background px-6 py-4 text-sm font-bold text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </motion.button>
            </motion.div>

            {/* Register Link */}
            <motion.div variants={fadeInUp} className="text-center pt-2">
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors group"
              >
                Create a free account
              </Link>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          variants={fadeInUp}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          By continuing, you agree to StudyBuddy&apos;s{" "}
          <Link href="/terms" className="text-primary hover:underline font-semibold">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline font-semibold">
            Privacy Policy
          </Link>
        </motion.p>
      </motion.div>
      </section>
    </main>
  );
}

