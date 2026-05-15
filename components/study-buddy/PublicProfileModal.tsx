"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, ShieldCheck, X } from "lucide-react";

interface PublicUserProfile {
  _id: string;
  name: string;
  image: string;
  bio: string;
  xp: number;
  level: number;
  badges: string[];
  preferredSubjects: string[];
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

export default function PublicProfileModal({
  userId,
  onClose,
  onConnect,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      setProfile(null);

      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/public`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch profile.");
        }

        if (!cancelled) {
          setProfile(data.user || null);
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

  const handleConnect = async () => {
    if (!profile || !onConnect) return;

    setConnecting(true);
    try {
      await onConnect(profile);
    } finally {
      setConnecting(false);
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
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
                <p className="font-semibold text-slate-900 dark:text-white">{error}</p>
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
                    {profile.image ? (
                      <img
                        src={profile.image}
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
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold text-[#7C3AED]">
                    <ShieldCheck size={14} />
                    Level {profile.level}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700 dark:text-gray-200">
                      XP Progress
                    </span>
                    <span className="font-bold text-[#7C3AED]">{profile.xp} XP</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#7C3AED]"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>

                <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  {profile.bio || "This student has not added a public bio yet."}
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

                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={!onConnect || connecting}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                  Connect
                </button>
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
