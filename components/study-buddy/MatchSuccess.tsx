"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, MessageCircle, Video, Sparkles, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface MatchSuccessProps {
  onCloseAction: () => void;
  matchData: { name: string; image: string; tags: string[] };
  sessionId: string;
}

/* ------------------------------------------------------------------ */
/*  CSS Confetti particles (no extra dependency)                       */
/* ------------------------------------------------------------------ */
function ConfettiParticles() {
  const [particles, setParticles] = useState<
    {
      id: number;
      x: number;
      delay: number;
      duration: number;
      size: number;
      color: string;
      rotation: number;
      drift: number;
    }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: Math.random() * 2 + 2.5,
        size: Math.random() * 6 + 4,
        color: [
          "#FFD700",
          "#C0C0C0",
          "#8c30e8",
          "#e830d5",
          "#ec4899",
          "#fbbf24",
          "#34d399",
          "#60a5fa",
          "#c084fc",
        ][Math.floor(Math.random() * 9)],
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 140,
      })),
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            rotate: `${p.rotation}deg`,
          }}
          initial={{ y: -20, opacity: 1, x: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.drift],
            opacity: [1, 1, 0],
            rotate: [p.rotation, p.rotation + 720],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Burst rings                                                        */
/* ------------------------------------------------------------------ */
function BurstRings() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[#8c30e8]/30"
          initial={{ width: 0, height: 0, opacity: 0.7 }}
          animate={{ width: 600, height: 600, opacity: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MatchSuccess Component                                             */
/* ------------------------------------------------------------------ */
export default function MatchSuccess({ onCloseAction, matchData, sessionId }: MatchSuccessProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"chat" | "video" | null>(null);

  const handleSelectMode = async (mode: "chat" | "video") => {
    if (!sessionId) {
      toast.error("Session not found. Please try again.");
      return;
    }
    setIsNavigating(true);
    setSelectedMode(mode);
    try {
      const res = await fetch("/api/study-buddy/mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, mode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to set mode");
      }
      router.push(`/dashboard/study-room/${sessionId}?mode=${mode}`);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      setIsNavigating(false);
      setSelectedMode(null);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const initials = matchData.name
    ? matchData.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
    : "NA";

  const currentUserName = session?.user?.name || "User";
  const currentUserImage = session?.user?.image || "";
  const currentUserInitials = currentUserName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <AnimatePresence>
      <motion.div
        key="match-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        // ✨ THEME UPDATE: White background in Light Mode, Dark Purple in Dark Mode
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-[#191121]/90 backdrop-blur-xl p-4"
      >
        <ConfettiParticles />
        <BurstRings />

        {/* Glass card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
            delay: 0.15,
          }}
          // ✨ THEME UPDATE: Card styling for Light/Dark
          className="relative w-full max-w-lg rounded-3xl p-8 md:p-12 text-center flex flex-col items-center shadow-2xl bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10"
        >
          {/* Close Button */}
          <button 
            onClick={onCloseAction} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* ── Avatars ── */}
          <div className="flex items-center justify-center mb-8 relative h-32 w-full">
            {/* Partner avatar – silver aura */}
            <div className="relative z-10 -translate-x-4">
              <motion.div
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.3 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                style={{
                  boxShadow: "0 0 30px rgba(192, 192, 192, 0.4)",
                  border: "2px solid rgba(192, 192, 192, 0.6)",
                }}
              >
                {matchData.image ? (
                  <img
                    src={matchData.image}
                    alt={matchData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white font-bold text-2xl">
                    {initials}
                  </div>
                )}
              </motion.div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#c0c0c0] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                PEER
              </div>
            </div>

            {/* User avatar – gold aura */}
            <div className="relative z-20 translate-x-4 -ml-8">
              <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.3 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                style={{
                  boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
                  border: "2px solid rgba(255, 215, 0, 0.6)",
                }}
              >
                {currentUserImage ? (
                  <img src={currentUserImage} alt={currentUserName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                    {currentUserInitials}
                  </div>
                )}
              </motion.div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#ffd700] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                YOU
              </div>
            </div>

            {/* Connector Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.55 }}
              className="absolute z-30 bg-[#8c30e8] rounded-full p-2 border-4 border-white dark:border-[#1a1524] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg"
            >
              <Sparkles size={20} className="text-white fill-white" />
            </motion.div>
          </div>

          {/* ── Heading ── */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-2 font-sans tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-slate-800 to-yellow-500 dark:from-[#FFD700] dark:via-white dark:to-[#C0C0C0] animate-shine bg-[length:200%_auto]">
              It&apos;s a Match!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-slate-600 dark:text-gray-300 text-lg"
          >
            {status === "loading" ? "You" : currentUserName} and{" "}
            <span className="text-slate-900 dark:text-white font-bold">{matchData.name}</span> match perfectly!
          </motion.p>

          {/* Tags */}
          {matchData.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap justify-center gap-2 mt-6 mb-8"
            >
              {matchData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* ── Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-4 w-full"
          >
            <button
              onClick={() => handleSelectMode("chat")}
              disabled={isNavigating}
              className="py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#8c30e8] to-[#e830d5] shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNavigating && selectedMode === "chat" ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <MessageCircle size={20} />
              )}
              Chat
            </button>
            <button
              onClick={() => handleSelectMode("video")}
              disabled={isNavigating}
              className="py-4 rounded-xl font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNavigating && selectedMode === "video" ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Video size={20} />
              )}
              Video
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}