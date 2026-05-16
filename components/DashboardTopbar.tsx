"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { BookOpen, Coins, Flame, Moon, Sun } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "./NotificationBell";

interface GamificationStats {
  xp: number;
  coins: number;
  streak: number;
  level: number;
  nextLevelXp: number;
}

const EMPTY_STATS: GamificationStats = {
  xp: 0,
  coins: 0,
  streak: 0,
  level: 1,
  nextLevelXp: 1000,
};

export function DashboardTopbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { role } = useUserStore();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [gamificationStats, setGamificationStats] =
    useState<GamificationStats>(EMPTY_STATS);

  const fullName = session?.user?.name || "User";
  const firstName = session?.user?.name?.split(" ")[0] || "User";
  const userEmail = session?.user?.email || "";
  const userImage = avatarFailed ? "" : session?.user?.image || "";
  const userInitials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  const roleLabel = session?.user?.role
    ? `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1).toLowerCase()}`
    : role === "MENTOR"
      ? "Mentor"
      : "Scholar";

  const xpForCurrentLevel = gamificationStats.xp % 1000;
  const xpProgress = Math.min(100, Math.round((xpForCurrentLevel / 1000) * 100));

  const fetchGamificationStats = useCallback(async () => {
    if (status !== "authenticated") return;

    const response = await fetch("/api/user/gamification-stats", {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.stats) {
      setGamificationStats({
        ...EMPTY_STATS,
        ...data.stats,
      });
    }
  }, [status]);

  useEffect(() => {
    void fetchGamificationStats();

    const onStatsUpdated = () => {
      void fetchGamificationStats();
    };

    window.addEventListener("gamification-stats-updated", onStatsUpdated);
    return () => {
      window.removeEventListener("gamification-stats-updated", onStatsUpdated);
    };
  }, [fetchGamificationStats]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED] shadow-lg shadow-purple-500/20">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-[#7C3AED]">StudyBuddy</h1>
          </div>

          {role === "STUDENT" ? (
            <div className="hidden w-48 flex-col md:flex">
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                <span>Scholar Rank</span>
                <span>
                  {xpForCurrentLevel.toLocaleString()}/1,000 XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#7C3AED]/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="relative h-full rounded-full bg-[#7C3AED]"
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </motion.div>
              </div>
            </div>
          ) : (
            <nav className="hidden items-center gap-6 md:flex">
              {["Dashboard", "Sessions", "Students", "Resources"].map((item, index) => (
                <a
                  key={item}
                  href="#"
                  className={`text-sm font-medium transition-colors ${
                    index === 0
                      ? "font-semibold text-[#7C3AED]"
                      : "text-muted-foreground hover:text-[#7C3AED]"
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
            <Flame className="text-orange-500" size={16} />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {gamificationStats.streak}
            </span>
          </div>

          {role === "MENTOR" && (
            <div className="hidden flex-col items-end lg:flex">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                  {roleLabel}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {xpForCurrentLevel.toLocaleString()} / 1,000 XP
                </span>
              </div>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#7C3AED]/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full rounded-full bg-[#7C3AED]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5">
            <Coins className="text-yellow-600 dark:text-yellow-400" size={16} />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
              {gamificationStats.coins.toLocaleString()}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="group relative rounded-lg p-2 transition-colors hover:bg-[#7C3AED]/10"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun
                className="text-muted-foreground transition-colors group-hover:text-[#7C3AED]"
                size={20}
              />
            ) : (
              <Moon
                className="text-muted-foreground transition-colors group-hover:text-[#7C3AED]"
                size={20}
              />
            )}
          </button>

          <NotificationBell />

          {role === "STUDENT" ? (
            <div className="flex items-center gap-3 border-l border-border/50 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-none">
                  {status === "loading" ? "Loading..." : `Welcome ${firstName}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {userEmail || `Level ${gamificationStats.level}`}
                </p>
              </div>
              <div className="group relative cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] font-bold text-white shadow-lg ring-2 ring-background ring-offset-2 ring-offset-primary/20">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={fullName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-md border border-background bg-yellow-400 px-1.5 py-0.5 text-[9px] font-black text-black shadow-sm">
                  {gamificationStats.level}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] font-bold text-white ring-2 ring-primary/20 transition-shadow hover:shadow-lg">
              {userImage ? (
                <img
                  src={userImage}
                  alt={fullName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                />
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
