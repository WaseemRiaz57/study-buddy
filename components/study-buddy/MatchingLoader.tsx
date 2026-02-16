"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Search Mode Messages
const SEARCH_MESSAGES = [
  "Scanning for active scholars...",
  "Analyzing study patterns...",
  "Verifying compatibility...",
  "Matching interests...",
  "Almost there...",
];

// Direct Connect Messages (New)
const CONNECT_MESSAGES = [
  "Establishing secure connection...",
  "Pinging peer...",
  "Waiting for response...",
  "Verifying availability...",
  "Almost connected...",
];

interface MatchingLoaderProps {
  onCancel: () => void;
  onMatchFound: () => void;
  mode?: "search" | "direct"; // New Prop
  peerName?: string;          // New Prop (Optional)
}

export default function MatchingLoader({
  onCancel,
  onMatchFound,
  mode = "search", // Default to search
  peerName = "Peer",
}: MatchingLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Select messages based on mode
  const messages = mode === "direct" ? CONNECT_MESSAGES : SEARCH_MESSAGES;
  
  // Select Title based on mode
  const title = mode === "direct" 
    ? `Connecting to ${peerName}...` 
    : "Finding your Study Buddy...";

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 750);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onMatchFound();
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onMatchFound]);

  return (
    <AnimatePresence>
      <motion.main
        key="matching-loader"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-50 bg-white/90 dark:bg-[#0f0a16]/95 backdrop-blur-xl"
      >
        {/* Ripple Effect */}
        <div className="relative w-[600px] h-[600px] flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border border-[#8c30e8]/30"
            style={{ animation: "ripple 1.5s linear infinite" }}
          />
          <div
            className="absolute inset-0 rounded-full border border-[#00ffcc]/40"
            style={{ animation: "ripple 1.5s linear infinite 0.5s" }}
          />

          {/* Central Orb */}
          <div
            className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center p-2 shadow-[0_0_20px_5px_rgba(140,48,232,0.4)]"
            style={{ animation: "float-loader 6s ease-in-out infinite" }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 relative bg-gradient-to-br from-[#8c30e8] to-fuchsia-500">
              <div className="absolute inset-0 flex items-center justify-center">
                 {/* Icon changes based on mode */}
                 {mode === "direct" ? (
                    <span className="material-symbols-outlined text-4xl text-white animate-pulse">wifi_tethering</span>
                 ) : (
                    <span className="text-3xl font-bold text-white/50 select-none">?</span>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="absolute bottom-[20%] flex flex-col items-center text-center z-20 space-y-5 px-4">
          <h1 className="text-3xl md:text-5xl text-slate-900 dark:text-white font-bold tracking-tight">
            {title}
          </h1>

          <div className="flex items-center gap-3 bg-white/60 dark:bg-white/10 px-6 py-3 rounded-full border border-[#8c30e8]/30 backdrop-blur-md shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8c30e8] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8c30e8]" />
            </span>

            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-slate-700 dark:text-white font-medium min-w-[200px]"
              >
                {messages[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <button
            onClick={onCancel}
            className="mt-4 px-6 py-2.5 rounded-full border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-sm font-medium"
          >
            Cancel {mode === "direct" ? "Request" : "Search"}
          </button>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}