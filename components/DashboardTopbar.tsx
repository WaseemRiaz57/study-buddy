"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { BookOpen, Flame, Coins, Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "./NotificationBell";

export function DashboardTopbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { role } = useUserStore();

  const fullName = session?.user?.name || "User";
  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || "";
  const userInitials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const mentorRoleLabel = session?.user?.role
    ? `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1).toLowerCase()}`
    : "Mentor";

  // Sample data - can be replaced with dynamic data later
  const studentData = {
    xp: 4500,
    maxXp: 5000,
    streak: 12,
    coins: 1240,
    title: "Master Scholar",
    level: 14,
    initials: "AS",
  };

  const mentorData = {
    role: mentorRoleLabel,
    xp: 8450,
    maxXp: 10000,
    gold: 1200,
  };

  const data = role === "MENTOR" ? mentorData : studentData;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left Side - Logo & Navigation/XP Bar */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 bg-gradient-to-br ${
              role === "MENTOR" 
                ? "from-blue-600 to-purple-600" 
                : "from-primary to-purple-600"
            } rounded-lg flex items-center justify-center shadow-lg ${
              role === "MENTOR" 
                ? "shadow-blue-500/20" 
                : "shadow-primary/20"
            }`}>
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className={`text-xl font-bold bg-gradient-to-r ${
              role === "MENTOR" 
                ? "from-blue-600 to-purple-600" 
                : "from-primary to-purple-400"
            } bg-clip-text text-transparent`}>
              StudyBuddy
            </h1>
          </div>

          {/* XP Progress (Student) or Navigation (Mentor) */}
          {role === "STUDENT" ? (
            <div className="hidden md:flex flex-col w-48">
              <div className="flex justify-between text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                <span>Scholar Rank</span>
                <span>{studentData.xp.toLocaleString()}/{studentData.maxXp.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(studentData.xp / studentData.maxXp) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </motion.div>
              </div>
            </div>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              {['Dashboard', 'Sessions', 'Students', 'Resources'].map((item, i) => (
                <a 
                  key={item} 
                  href="#" 
                  className={`text-sm font-medium transition-colors ${
                    i === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Right Side - Stats, Theme Toggle, Notifications & Profile */}
        <div className="flex items-center gap-4">
          {/* Streak (Student Only) */}
          {role === "STUDENT" && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
              <Flame className="text-orange-500" size={16} />
              <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{studentData.streak}</span>
            </div>
          )}

          {/* XP Bar (Mentor Only) */}
          {role === "MENTOR" && (
            <div className="hidden lg:flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{mentorData.role}</span>
                <span className="text-xs font-medium text-muted-foreground">{mentorData.xp.toLocaleString()} / {mentorData.maxXp.toLocaleString()} XP</span>
              </div>
              <div className="w-48 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(mentorData.xp / mentorData.maxXp) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Coins/Gold */}
          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
            <Coins className="text-yellow-600 dark:text-yellow-400" size={16} />
            <span className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">
              {role === "MENTOR" ? mentorData.gold.toLocaleString() : studentData.coins.toLocaleString()}
            </span>
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors group"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
            ) : (
              <Moon className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile */}
          {role === "STUDENT" ? (
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">
                  {status === "loading" ? "Loading..." : `Welcome ${firstName}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userEmail || `${studentData.title} • Level ${studentData.level}`}
                </p>
              </div>
              <div className="relative cursor-pointer group">
                <div className="w-10 h-10 rounded-full ring-2 ring-background ring-offset-2 ring-offset-primary/20 overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {userImage ? (
                    <img src={userImage} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-background shadow-sm text-black">{studentData.level}</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
              {userImage ? (
                <img src={userImage} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
