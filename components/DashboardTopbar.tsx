"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  Coins,
  Flame,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Star,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { markStudyBuddyOffline } from "@/hooks/useOfflinePresence";
import { useUserStore } from "@/store/useUserStore";
import { NotificationBell } from "./NotificationBell";
import { useGamificationStore } from "@/store/useGamificationStore";

export function DashboardTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar?: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const { role } = useUserStore();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isBuyingFreeze, setIsBuyingFreeze] = useState(false);
  const { xp, coins, streak, streakFreezes, level } = useGamificationStore(
    (state) => state.stats
  );
  const setGamificationStats = useGamificationStore((state) => state.setStats);
  const refreshGamificationStats = useGamificationStore((state) => state.refresh);
  const resetGamificationStats = useGamificationStore((state) => state.reset);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
  const subscriptionPlan = String(
    session?.user?.subscriptionPlan || ""
  ).toLowerCase();
  const roleLabel = session?.user?.role
    ? String(session.user.role).toLowerCase() === "teacher" ||
      String(session.user.role).toLowerCase() === "mentor"
      ? "Teacher"
      : `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1).toLowerCase()}`
    : role === "TEACHER" || role === "MENTOR"
      ? "Teacher"
      : "Scholar";
  const paidPlanLabel =
    subscriptionPlan === "elite" ? "ELITE" : subscriptionPlan === "pro" ? "PRO" : "";
  const normalizedSessionRole = String(session?.user?.role || role || "").toLowerCase();
  const isAdminUser = normalizedSessionRole === "admin";

  const xpForCurrentLevel = xp % 1000;
  const xpProgress = Math.min(100, Math.round((xpForCurrentLevel / 1000) * 100));

  const fetchGamificationStats = useCallback(async () => {
    if (status !== "authenticated") return;

    await refreshGamificationStats();
  }, [refreshGamificationStats, status]);

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

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [userMenuOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    markStudyBuddyOffline();
    resetGamificationStats();
    await signOut({ callbackUrl: "/", redirect: true });
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit review.");
      }

      toast.success(
        data?.message || "Thank you, your review is pending approval."
      );
      setReviewOpen(false);
      setReviewRating(0);
      setReviewComment("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avatarButton = (
    <button
      type="button"
      onClick={() => setUserMenuOpen((current) => !current)}
      className="group flex min-h-[44px] items-center gap-2 rounded-full p-1 transition-colors hover:bg-[#7C3AED]/10"
      aria-haspopup="menu"
      aria-expanded={userMenuOpen}
    >
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] font-bold text-white shadow-lg ring-2 ring-background ring-offset-2 ring-offset-[#7C3AED]/20">
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
        {role === "STUDENT" && (
          <div className="absolute -bottom-1 -right-1 rounded-md border border-background bg-yellow-400 px-1.5 py-0.5 text-[9px] font-black text-black shadow-sm">
            {level}
          </div>
        )}
      </div>
      <ChevronDown
        size={14}
        className={`hidden text-muted-foreground transition-transform sm:block ${
          userMenuOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-3 py-2.5 sm:px-4 lg:px-6 lg:py-3">
        <div className="mr-auto flex min-w-0 flex-1 items-center gap-3 lg:gap-8">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="hidden w-48 flex-col md:flex">
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                <span>
                  {role === "TEACHER" || role === "MENTOR"
                    ? "Teacher Rank"
                    : "Scholar Rank"}
                </span>
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
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:gap-4">
          <button
            onClick={() => setStoreOpen(true)}
            className="hidden min-h-[44px] items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 transition-colors hover:border-[#7C3AED]/40 sm:flex"
            title="Open streak store"
          >
            <Flame className="text-orange-500" size={16} />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {streak}
            </span>
          </button>

          <button
            onClick={() => setStoreOpen(true)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1.5 transition-colors hover:border-[#7C3AED]/40 sm:px-3"
            title="Open coin store"
          >
            <Coins className="text-yellow-600 dark:text-yellow-400" size={16} />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
              {coins.toLocaleString()}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="group relative min-h-[44px] min-w-[44px] rounded-lg p-3 transition-colors hover:bg-[#7C3AED]/10"
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

          {!isAdminUser && <NotificationBell />}

          <div ref={userMenuRef} className="relative shrink-0">
            {role === "STUDENT" ? (
              <div className="flex items-center gap-2 border-l border-border/50 pl-2 sm:gap-3 sm:pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-none">
                  {status === "loading" ? "Loading..." : `Welcome ${firstName}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {userEmail || `Level ${level}`}
                </p>
              </div>
              {avatarButton}
            </div>
            ) : (
              avatarButton
            )}

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-[80] mt-3 w-[calc(100vw-1.5rem)] max-w-64 rounded-2xl border border-border bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#191121]"
              >
                <div className="border-b border-border px-3 py-3 dark:border-white/10">
                  <p className="truncate text-sm font-bold text-foreground">
                    {fullName}
                    {paidPlanLabel && (
                      <span className="ml-2 rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-2 py-0.5 align-middle text-[10px] font-black text-[#7C3AED]">
                        {paidPlanLabel}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {userEmail || roleLabel}
                  </p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="mt-2 flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                  role="menuitem"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setReviewOpen(true);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                  role="menuitem"
                >
                  <Star size={16} />
                  Review App
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    {storeOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#191121] sm:max-w-md sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Coin Store
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">
                Streak Protection
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Spend coins to protect your streak when life gets noisy.
              </p>
            </div>
            <button
              onClick={() => setStoreOpen(false)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
              aria-label="Close store"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                <Shield size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground">Streak Freeze</h3>
                <p className="text-xs text-muted-foreground">
                  Uses automatically after a missed day.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground">Owned</p>
                <p className="text-lg font-black text-[#7C3AED]">
                  {streakFreezes}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-white/5">
              <div>
                <p className="text-sm font-semibold text-foreground">Price</p>
                <p className="text-xs text-muted-foreground">200 coins each</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setIsBuyingFreeze(true);
                    const response = await fetch("/api/store/streak-freeze", {
                      method: "POST",
                    });
                    const data = await response.json().catch(() => null);

                    if (!response.ok) {
                      throw new Error(data?.message || "Failed to buy freeze.");
                    }

                    setGamificationStats(data.stats || {});
                    window.dispatchEvent(new Event("gamification-stats-updated"));
                    toast.success(data?.message || "Streak Freeze purchased.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to buy freeze."
                    );
                  } finally {
                    setIsBuyingFreeze(false);
                  }
                }}
                disabled={isBuyingFreeze || coins < 200}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBuyingFreeze ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                Buy Freeze
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {reviewOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#191121] sm:max-w-md sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Platform Review
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">
                Share Your Feedback
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews are published after admin approval.
              </p>
            </div>
            <button
              onClick={() => setReviewOpen(false)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
              aria-label="Close review modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-5 flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= reviewRating;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                  aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    size={30}
                    className={
                      active
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300 dark:text-slate-600"
                    }
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            rows={5}
            maxLength={1200}
            placeholder="Tell us what is working well, or what would make StudyBuddy better..."
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 dark:border-white/10"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Minimum 10 characters</span>
            <span>{reviewComment.length}/1200</span>
          </div>

          <button
            type="button"
            onClick={() => void handleSubmitReview()}
            disabled={
              isSubmittingReview ||
              reviewRating === 0 ||
              reviewComment.trim().length < 10
            }
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingReview && <Loader2 size={16} className="animate-spin" />}
            Submit Feedback
          </button>
        </div>
      </div>
    )}
    </>
  );
}

