"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Coins,
  Gift,
  Loader2,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface PublicUserProfile {
  _id: string;
  name: string;
  image: string;
  profileImage?: string;
  role: "student" | "teacher";
  bio: string;
  xp: number;
  level: number;
  badges: string[];
  preferredSubjects: string[];
  createdAt?: string | null;
}

interface PublicProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onConnect?: (profile: PublicUserProfile) => Promise<void> | void;
}

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SB"
  );
}

function formatJoinDate(value?: string | null) {
  if (!value) return "Joined recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Joined recently";

  return `Joined ${date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

export default function PublicProfileModal({
  userId,
  onClose,
  onConnect,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [giftAmount, setGiftAmount] = useState("");
  const [sendingGift, setSendingGift] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      setProfile(null);
      setGiftAmount("");

      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/public`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch profile.");
        }

        if (!cancelled) {
          setProfile(data?.user || null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to fetch profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const xpProgress = useMemo(() => {
    if (!profile) return 0;
    const currentLevelXp = profile.xp % 250;
    if (profile.xp <= 0) return 8;
    return Math.min(100, Math.max(8, currentLevelXp === 0 ? 100 : currentLevelXp / 2.5));
  }, [profile]);

  const image = profile?.profileImage || profile?.image || "";
  const numericGiftAmount = Number(giftAmount);
  const canGift = Number.isInteger(numericGiftAmount) && numericGiftAmount > 0;

  const handleConnect = async () => {
    if (!profile || !onConnect) return;

    setConnecting(true);
    try {
      await onConnect(profile);
    } finally {
      setConnecting(false);
    }
  };

  const sendGift = async () => {
    if (!profile || !canGift) return;

    try {
      setSendingGift(true);
      const response = await fetch(`/api/users/${profile._id}/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericGiftAmount }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to gift coins.");
      }

      toast.success(data?.message || "Coins gifted successfully.");
      window.dispatchEvent(new Event("gamification-stats-updated"));
      setGiftAmount("");
    } catch (giftError) {
      toast.error(
        giftError instanceof Error ? giftError.message : "Failed to gift coins."
      );
    } finally {
      setSendingGift(false);
    }
  };

  return (
    <AnimatePresence>
      {userId && (
        <motion.div
          key="public-profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
          onMouseDown={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a1524]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close public profile"
            >
              <X size={20} />
            </button>

            {loading && (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
              </div>
            )}

            {!loading && error && (
              <div className="min-h-[220px] pt-16 text-center">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Close
                </button>
              </div>
            )}

            {!loading && profile && (
              <div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#7C3AED] bg-slate-100 shadow-lg shadow-[#7C3AED]/15 dark:bg-white/10">
                    {image ? (
                      <img
                        src={image}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#7C3AED] text-2xl font-bold text-white">
                        {initialsFor(profile.name)}
                      </div>
                    )}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                    {profile.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold capitalize text-[#7C3AED]">
                      <ShieldCheck size={14} />
                      {profile.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      <CalendarDays size={14} />
                      {formatJoinDate(profile.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700 dark:text-gray-200">
                      XP Progress
                    </span>
                    <span className="font-bold text-[#7C3AED]">
                      {profile.xp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#7C3AED]"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  {profile.bio || "This user has not added a public bio yet."}
                </p>

                {profile.badges.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                      Badges
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-[#7C3AED]/25 bg-white px-3 py-1 text-xs font-semibold text-[#7C3AED] dark:bg-white/5"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                    Preferred Subjects
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.preferredSubjects.length > 0 ? (
                      profile.preferredSubjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white"
                        >
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-gray-500">
                        No preferred subjects yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
                    <Gift size={16} />
                    Gift Coins
                  </div>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Coins
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={giftAmount}
                        onChange={(event) => setGiftAmount(event.target.value)}
                        placeholder="Amount"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void sendGift()}
                      disabled={!canGift || sendingGift}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingGift ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Gift size={16} />
                      )}
                      Gift
                    </button>
                  </div>
                </div>

                {onConnect && (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                    Connect
                  </button>
                )}
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

