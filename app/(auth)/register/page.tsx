"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Sparkles, CheckCircle, User, Mail, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react"; // 👈 1. Google Auth Import Kiya

interface RoleCardProps {
  role: "student" | "mentor";
  selectedRole: "student" | "mentor";
  onSelect: (role: "student" | "mentor") => void;
  title: string;
  description: string;
  icon: any;
  primaryColor: string;
  hoverColor: string;
  bgColor: string;
  shadowColor: string;
  iconBg: string;
  checkColor: string;
}

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "mentor">("student");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const roleConfig = {
    student: {
      title: "Scholar",
      description: "I want to learn, join rooms, and track progress.",
      icon: GraduationCap,
      primaryColor: "border-primary bg-primary/5",
      hoverColor: "hover:border-primary/50",
      bgColor: "bg-primary",
      shadowColor: "shadow-[0_0_30px_rgba(140,48,232,0.15)]",
      buttonBg: "bg-primary shadow-primary/30",
      iconBg: "bg-primary text-white",
      checkColor: "text-primary",
    },
    mentor: {
      title: "Mentor",
      description: "I want to guide others, host sessions, and earn.",
      icon: Sparkles,
      primaryColor: "border-accent-mint bg-accent-mint/5",
      hoverColor: "hover:border-accent-mint/50",
      bgColor: "bg-accent-mint text-slate-900",
      shadowColor: "shadow-[0_0_30px_rgba(0,255,163,0.15)]",
      buttonBg: "bg-gradient-to-r from-emerald-500 to-accent-mint text-slate-900 shadow-emerald-500/20",
      iconBg: "bg-accent-mint text-slate-900",
      checkColor: "text-accent-mint",
    },
  };

  // --- CUSTOM EMAIL/PASSWORD REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
          role: role, // 👈 Isko lowercase hi bhejna hai taake MongoDB ka enum error na aaye
        }),
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        const data = await response.json();
        alert(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      alert("Network error. Please check your internet or MongoDB IP whitelist.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 GOOGLE REGISTRATION LOGIC ---
  const handleGoogleRegister = () => {
    setIsLoading(true);
    // Backend ko batane ke liye cookie set kar rahe hain ke konsa role select kiya hai
    document.cookie = `intended_role=${role}; path=/; max-age=300`; // 5 min tak valid rahegi
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const RoleCard = ({ 
    role: cardRole, selectedRole, onSelect, title, description, icon: Icon,
    primaryColor, hoverColor, shadowColor, iconBg, checkColor
  }: RoleCardProps) => {
    const isSelected = selectedRole === cardRole;
    
    return (
      <div 
        onClick={() => onSelect(cardRole)}
        className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group ${
          isSelected ? `${primaryColor} ${shadowColor} scale-[1.02]` : `border-border/50 ${hoverColor} hover:bg-slate-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100`
        }`}
      >
        {isSelected && (
          <div className={`absolute top-3 right-3 ${checkColor}`}>
            <CheckCircle size={20} fill="currentColor" className="text-white dark:text-black" />
          </div>
        )}
        <div className={`p-4 rounded-full transition-colors ${isSelected ? iconBg : "bg-slate-100 dark:bg-white/10 text-slate-500 group-hover:text-primary"}`}>
          <Icon size={28} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <main className="auth-page min-h-screen bg-background text-foreground px-4 py-12 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-mint/10 rounded-full blur-[120px]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors z-20">
        <ArrowLeft size={18} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden bg-card/80 backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-3">
            Choose Your Path
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Join StudyBuddy as...
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(roleConfig) as Array<"student" | "mentor">).map((key) => {
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
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="relative group">
                 <input 
                  type="text" 
                  placeholder="Last Name" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
              <input 
                type="email" 
                placeholder="email@university.edu" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
              <input 
                type="password" 
                placeholder="Create Password" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${roleConfig[role].buttonBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" /> Creating Account...
              </>
            ) : (
              `Join as ${roleConfig[role].title}`
            )}
          </button>

          {/* 👇 Google Registration Section Added Here */}
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
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Log in
            </Link>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
