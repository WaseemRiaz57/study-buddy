"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Sparkles, CheckCircle, User, Mail, Lock, Loader2 } from "lucide-react";
import { useState } from "react";

// 1. Updated Interface to include missing props
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
  iconBg: string;      // Added this
  checkColor: string;  // Added this
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

  // Role Configuration Object
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Registering User:", { ...formData, role });
    setTimeout(() => setIsLoading(false), 2000);
  };

  // 2. Reusable RoleCard Component (No changes needed, interface fixed above)
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
    checkColor
  }: RoleCardProps) => {
    const isSelected = selectedRole === cardRole;
    
    return (
      <div 
        onClick={() => onSelect(cardRole)}
        className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group ${
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
        <div className={`p-4 rounded-full transition-colors ${
          isSelected ? iconBg : "bg-slate-100 dark:bg-white/10 text-slate-500 group-hover:text-primary"
        }`}>
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
    <main className="min-h-screen bg-background text-foreground px-4 py-12 flex flex-col items-center justify-center transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-mint/10 rounded-full blur-[120px]" />
      </div>

      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors z-20">
        <ArrowLeft size={18} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
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
          
          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(roleConfig).map((key) => {
              const r = key as "student" | "mentor";
              const config = roleConfig[r];
              return (
                <RoleCard
                  key={r}
                  role={r}
                  selectedRole={role}
                  onSelect={setRole}
                  {...config}
                />
              );
            })}
          </div>

          {/* Input Fields */}
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

          <div className="text-center text-sm text-muted-foreground">
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