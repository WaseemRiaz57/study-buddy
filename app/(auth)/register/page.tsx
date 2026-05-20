"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { type ElementType, type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

interface RoleCardProps {
  role: "student" | "teacher";
  selectedRole: "student" | "teacher";
  onSelect: (role: "student" | "teacher") => void;
  title: string;
  description: string;
  icon: ElementType;
  primaryColor: string;
  hoverColor: string;
  shadowColor: string;
  iconBg: string;
  checkColor: string;
}

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const roleConfig = {
    student: {
      title: "Scholar",
      description: "I want to learn, join rooms, and track progress.",
      icon: GraduationCap,
      primaryColor: "border-primary bg-primary/5",
      hoverColor: "hover:border-primary/50",
      shadowColor: "shadow-[0_0_30px_rgba(140,48,232,0.15)]",
      buttonBg: "bg-primary shadow-primary/30",
      iconBg: "bg-primary text-white",
      checkColor: "text-primary",
    },
    teacher: {
      title: "Mentor",
      description: "I want to guide others, host sessions, and earn.",
      icon: Sparkles,
      primaryColor: "border-[#7C3AED] bg-[#7C3AED]/5",
      hoverColor: "hover:border-[#7C3AED]/50",
      shadowColor: "shadow-[0_0_30px_rgba(124,58,237,0.15)]",
      buttonBg: "bg-[#7C3AED] hover:bg-purple-700 text-white shadow-purple-500/20",
      iconBg: "bg-[#7C3AED] text-white",
      checkColor: "text-[#7C3AED]",
    },
  };

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setResendTimer((currentTimer) => Math.max(0, currentTimer - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setPasswordError("");

    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send verification code.");
    }

    setStep(2);
    setResendTimer(60);
    toast.success("Verification code sent! Please also check your spam/junk folder.");
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification code.");
      }

      setResendTimer(60);
      toast.success("Verification code resent!");
    } catch (error) {
      console.error("Resend OTP Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not resend the verification code."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCreateAccount = async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
        otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed. Please try again.");
    }

    toast.success("Account verified and created!");
    window.location.href = "/login";
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      if (step === 1) {
        await handleSendOtp();
      } else {
        await handleCreateAccount();
      }
    } catch (error) {
      console.error("Registration Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Network error. Please check your internet or MongoDB IP whitelist."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setIsLoading(true);
    document.cookie = `intended_role=${role}; path=/; max-age=300`;
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const RoleCard = ({
    role: cardRole,
    selectedRole,
    onSelect,
    title,
    description,
    icon: Icon,
    primaryColor,
    hoverColor,
    shadowColor,
    iconBg,
    checkColor,
  }: RoleCardProps) => {
    const isSelected = selectedRole === cardRole;

    return (
      <button
        type="button"
        onClick={() => onSelect(cardRole)}
        aria-pressed={isSelected}
        className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group sm:p-6 ${
          isSelected
            ? `${primaryColor} ${shadowColor} scale-[1.02]`
            : `border-border/50 ${hoverColor} hover:bg-slate-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100`
        }`}
      >
        {isSelected && (
          <div className={`absolute top-3 right-3 ${checkColor}`}>
            <CheckCircle size={20} fill="currentColor" className="text-white dark:text-black" />
          </div>
        )}
        <div
          className={`p-4 rounded-full transition-colors ${
            isSelected
              ? iconBg
              : "bg-slate-100 dark:bg-white/10 text-slate-500 group-hover:text-primary"
          }`}
        >
          <Icon size={28} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </button>
    );
  };

  return (
    <main className="auth-page min-h-screen w-full flex bg-background text-foreground transition-colors duration-300 lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full w-full bg-muted lg:block">
        <Image
          src="/register.png"
          alt="Join Community"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/20" />
      </div>

      <section className="relative flex w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-8 lg:p-12">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-mint/10 rounded-full blur-[120px]" />
      </div>

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:left-8 sm:top-8"
      >
        <ArrowLeft size={18} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden bg-card/80 backdrop-blur-xl"
      >
        <header className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 backdrop-blur-xl">
            <BrandLogo size="lockup" />
            <span className="text-2xl font-black tracking-tight text-[#7C3AED]">
              StudyBuddy
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-3">
            {step === 1 ? "Choose Your Path" : "Verify Your Email"}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {step === 1 ? "Join StudyBuddy as..." : "Enter your code"}
          </h1>
        </header>

        <form onSubmit={handleRegister} className="space-y-8 min-h-[620px]">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(roleConfig) as Array<"student" | "teacher">).map((key) => {
                  const config = roleConfig[key];
                  return (
                    <RoleCard
                      key={key}
                      role={key}
                      selectedRole={role}
                      onSelect={setRole}
                      {...config}
                    />
                  );
                })}
              </div>

              <div className="space-y-4 pt-6 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                    <input
                      type="text"
                      placeholder="First Name"
                      aria-label="First name"
                      required
                      value={formData.firstName}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Last Name"
                      aria-label="Last name"
                      required
                      value={formData.lastName}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    placeholder="email@university.edu"
                    aria-label="Email address"
                    required
                    value={formData.email}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password"
                    aria-label="Create password"
                    required
                    value={formData.password}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                    onChange={(e) => {
                      const password = e.target.value;
                      setFormData({ ...formData, password });
                      setPasswordError(
                        formData.confirmPassword && password !== formData.confirmPassword
                          ? "Passwords do not match."
                          : ""
                      );
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    aria-label="Confirm password"
                    required
                    value={formData.confirmPassword}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? "confirm-password-error" : undefined}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                    onChange={(e) => {
                      const confirmPassword = e.target.value;
                      setFormData({ ...formData, confirmPassword });
                      setPasswordError(
                        formData.password && formData.password !== confirmPassword
                          ? "Passwords do not match."
                          : ""
                      );
                    }}
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id="confirm-password-error" className="text-sm font-semibold text-red-500">
                    {passwordError}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6 pt-6 border-t border-border/50">
              <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-6 py-8">
                <div className="rounded-full bg-primary/10 p-4 text-primary">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit verification code to
                </p>
                <p className="font-bold text-foreground break-all">{formData.email}</p>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  aria-label="Enter OTP"
                  autoComplete="one-time-code"
                  required
                  value={otp}
                  className="w-full px-4 py-4 rounded-xl border border-border bg-background/50 text-center text-2xl font-bold tracking-[0.45em] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>

              <div className="flex h-10 items-center justify-center">
                <button
                  type="button"
                  aria-label={
                    resendTimer > 0
                      ? `Resend code available in ${resendTimer} seconds`
                      : "Resend verification code"
                  }
                  disabled={resendTimer > 0 || isResending || isLoading}
                  onClick={handleResend}
                  className="inline-flex min-w-[190px] items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : resendTimer > 0 ? (
                    <span className="inline-block min-w-[150px] text-center tabular-nums">
                      Resend code in {resendTimer}s
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setStep(1)}
                className="w-full rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                Edit details
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 ${roleConfig[role].buttonBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                {step === 1 ? "Sending Code..." : "Verifying..."}
              </>
            ) : step === 1 ? (
              `Send Code as ${roleConfig[role].title}`
            ) : (
              "Verify and Create Account"
            )}
          </button>

          {step === 1 && (
            <>
              <div className="relative py-2 mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-semibold">
                    Or register with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="flex w-full mt-2 items-center justify-center gap-3 rounded-xl border border-border bg-background px-6 py-4 text-sm font-bold text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Log in
            </Link>
          </div>
        </form>
      </motion.div>
      </section>
    </main>
  );
}

