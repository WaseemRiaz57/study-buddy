"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, Send, UserRound, X } from "lucide-react";

const SEARCH_MESSAGES = [
  "Checking open listings...",
  "Matching by exact subject...",
  "Reviewing active study partners...",
  "Preparing your listing...",
];

interface MatchedUser {
  userId: string;
  name: string;
  image?: string;
  subject: string;
  topic?: string;
}

interface MatchingLoaderProps {
  onCancel: () => void;
  status: "searching" | "match_found" | "no_match";
  mode?: "search" | "direct";
  peerName?: string;
  subject?: string;
  matchedUser?: MatchedUser | null;
  isSendingRequest?: boolean;
  onSendJoinRequest?: () => void;
  onGoBack?: () => void;
  onOpenProfile?: (userId: string) => void;
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

export default function MatchingLoader({
  onCancel,
  status,
  mode = "search",
  peerName = "Peer",
  subject = "",
  matchedUser,
  isSendingRequest,
  onSendJoinRequest,
  onGoBack,
  onOpenProfile,
}: MatchingLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = useMemo(
    () =>
      mode === "direct"
        ? ["Sending request...", "Waiting for response...", "Keeping your place ready..."]
        : SEARCH_MESSAGES,
    [mode]
  );

  useEffect(() => {
    if (status !== "searching") return;

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 900);

    return () => clearInterval(interval);
  }, [messages.length, status]);

  const title =
    mode === "direct" ? `Connecting to ${peerName}...` : "Finding your Study Buddy...";
  const matchedName = matchedUser?.name || "Study Buddy";
  const matchedInitials = initialsFor(matchedName);

  return (
    <motion.main
      key="matching-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-white/95 px-4 backdrop-blur-xl dark:bg-[#0f0a16]/95"
    >
      <AnimatePresence mode="wait">
        {status === "searching" && (
          <motion.section
            key="searching"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex w-full max-w-xl flex-col items-center text-center"
          >
            <div className="relative mb-10 flex h-56 w-56 items-center justify-center">
              <span className="absolute h-32 w-32 animate-ping rounded-full border-4 border-[#7C3AED]/25" />
              <span className="absolute h-44 w-44 animate-pulse rounded-full border border-[#7C3AED]/20" />
              <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#7C3AED] bg-white text-[#7C3AED] shadow-xl shadow-[#7C3AED]/15 dark:bg-[#1a1524]">
                <UserRound size={44} />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              {title}
            </h1>
            <div className="mt-6 flex items-center gap-3 rounded-full border border-[#7C3AED]/25 bg-white px-6 py-3 shadow-sm dark:bg-white/10">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C3AED] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#7C3AED]" />
              </span>
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="min-w-[210px] text-sm font-semibold text-slate-700 dark:text-white"
              >
                {messages[msgIndex]}
              </motion.p>
            </div>

            <button
              onClick={onCancel}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <X size={16} />
              Cancel {mode === "direct" ? "Request" : "Search"}
            </button>
          </motion.section>
        )}

        {status === "match_found" && matchedUser && (
          <motion.section
            key="match-found"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#1a1524]"
          >
            <button
              type="button"
              onClick={() => onOpenProfile?.(matchedUser.userId)}
              className="mx-auto block rounded-full focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/20"
              aria-label={`View ${matchedName} public profile`}
            >
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-[#7C3AED] bg-slate-100 shadow-xl shadow-[#7C3AED]/20 dark:bg-white/10">
                {matchedUser.image ? (
                  <img
                    src={matchedUser.image}
                    alt={matchedName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#7C3AED] text-3xl font-bold text-white">
                    {matchedInitials}
                  </div>
                )}
              </div>
            </button>

            <h1 className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
              Match Found!
            </h1>
            <button
              type="button"
              onClick={() => onOpenProfile?.(matchedUser.userId)}
              className="mt-2 text-lg font-semibold text-[#7C3AED] hover:underline"
            >
              {matchedName}
            </button>
            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
              {matchedUser.subject}
              {matchedUser.topic ? ` • ${matchedUser.topic}` : ""}
            </p>

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={onSendJoinRequest}
                disabled={isSendingRequest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingRequest ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Send Join Request
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </motion.section>
        )}

        {status === "no_match" && (
          <motion.section
            key="no-match"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#1a1524]"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#7C3AED] text-[#7C3AED]">
              <Search size={36} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
              No open listings right now for this subject.
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
              Your {subject ? `${subject} ` : ""}listing is live, so another student can request to join you.
            </p>
            <button
              type="button"
              onClick={onGoBack || onCancel}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-opacity hover:opacity-90"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

