"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Clock,
  Star,
  Sparkles,
  Award,
  Gem,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";

// ════════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  sender: "me" | "peer" | "system";
  text: string;
  time: string;
}

interface PeerInfo {
  name: string;
  image: string;
}

// ════════════════════════════════════════════════════════════════════
//  PAGE
// ════════════════════════════════════════════════════════════════════

export default function BuddySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as "chat" | "video") || "chat";

  const { data: session } = useSession();
  const router = useRouter();

  // ── Core state ─────────────────────────────────────────────────
  const [sessionState, setSessionState] = useState<"active" | "review">(
    "active"
  );
  const [peer, setPeer] = useState<PeerInfo>({ name: "Study Buddy", image: "" });
  const [subject, setSubject] = useState("");

  // ── Timer ──────────────────────────────────────────────────────
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (sessionState !== "active") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sessionState]);
  const fmt = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Fetch session meta ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/study-buddy/status?sessionId=${sessionId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.peer) setPeer(data.peer);
        if (data.subject) setSubject(data.subject);
      } catch {
        /* ignore */
      }
    })();
  }, [sessionId]);

  // ── End session ────────────────────────────────────────────────
  const handleEndSession = () => setSessionState("review");

  // ── After review ───────────────────────────────────────────────
  const handleReviewDone = () => router.push("/dashboard/study-buddy");

  return (
    <div className="fixed inset-0 z-50 flex flex-col font-sans transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-[#0f0a16] dark:text-white">
      {/* BG ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {sessionState === "active" ? (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-full"
          >
            <ActiveSession
              mode={mode}
              sessionId={sessionId}
              peer={peer}
              subject={subject}
              seconds={seconds}
              formatTime={fmt}
              currentUser={{
                name: session?.user?.name || "You",
                image: session?.user?.image || "",
              }}
              onEndSession={handleEndSession}
            />
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <PostSessionReview
              peer={peer}
              subject={subject}
              duration={fmt(seconds)}
              onDone={handleReviewDone}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ACTIVE SESSION
// ════════════════════════════════════════════════════════════════════

function ActiveSession({
  mode,
  sessionId,
  peer,
  subject,
  seconds,
  formatTime,
  currentUser,
  onEndSession,
}: {
  mode: "chat" | "video";
  sessionId: string;
  peer: PeerInfo;
  subject: string;
  seconds: number;
  formatTime: (t: number) => string;
  currentUser: PeerInfo;
  onEndSession: () => void;
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSidebar, setShowSidebar] = useState(mode === "video");

  return (
    <>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b backdrop-blur-md transition-colors
          bg-white/80 border-slate-200
          dark:bg-[#0f0a16]/80 dark:border-white/5"
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Peer avatar */}
            <div className="relative shrink-0">
              {peer.image ? (
                <img
                  src={peer.image}
                  alt={peer.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]   flex items-center justify-center text-white font-bold text-sm">
                  {peer.name.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0f0a16] animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                {peer.name}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] border font-mono transition-colors
                    bg-red-50 text-red-500 border-red-200
                    dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                >
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/50">
                {subject || "Study Session"} &middot; 1-on-1
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden md:block" />

          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors
              bg-slate-100 border-slate-200 text-slate-600
              dark:bg-white/5 dark:border-white/10 dark:text-gray-300"
          >
            <Clock size={14} className="text-primary" />
            <span>{formatTime(seconds)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {mode === "video" && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2.5 rounded-xl transition-all ${
                showSidebar
                  ? "bg-primary/10 text-primary dark:bg-primary dark:text-white"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
            >
              <MessageSquare size={18} />
            </button>
          )}
          <button
            onClick={onEndSession}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C3AED]   border border-red-500/30 text-red-600 dark:text-red-200 text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)] dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]   transition-all"
          >
            <PhoneOff size={16} />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </header>

      {/* ── Main Area ──────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        {mode === "video" ? (
          <>
            {/* Video Grid */}
            <section className="flex-1 flex flex-col transition-colors bg-slate-100 dark:bg-[#130d1a]">
              <VideoGrid
                peer={peer}
                currentUser={currentUser}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
              />

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors
                    bg-white/90 border-slate-200
                    dark:bg-[#191121]/90 dark:border-white/10"
                >
                  <ControlBtn
                    isActive={!isMuted}
                    onClick={() => setIsMuted(!isMuted)}
                    iconOn={Mic}
                    iconOff={MicOff}
                  />
                  <ControlBtn
                    isActive={!isVideoOff}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    iconOn={Video}
                    iconOff={VideoOff}
                  />
                  <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />
                  <button className="flex flex-col items-center gap-1 group px-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                        bg-purple-600 text-white dark:bg-primary"
                    >
                      <MonitorUp size={18} />
                    </div>
                    <span className="text-[10px] font-medium text-purple-600 dark:text-primary">
                      Share
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* Chat sidebar (collapsible) */}
            <AnimatePresence>
              {showSidebar && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex flex-col shadow-xl z-20 border-l transition-colors
                    bg-white border-slate-200
                    dark:bg-[#0f0a16] dark:border-white/5"
                >
                  <ChatPanel peer={peer} currentUser={currentUser} />
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* ──── Chat-only mode: sidebar + main chat ──── */
          <div className="flex w-full h-full max-w-[1600px] mx-auto p-4 gap-4">
            {/* Aside */}
            <aside
              className="glass-panel w-80 flex-shrink-0 hidden lg:flex flex-col rounded-2xl overflow-hidden shadow-2xl
                border-slate-200 dark:border-white/10"
            >
              <div className="p-6 pb-2">
                <h1 className="text-slate-900 dark:text-white font-serif text-lg font-medium tracking-wide">
                  My Study Space
                </h1>
                <p className="text-slate-500 dark:text-white/50 text-xs mt-0.5">
                  Online &middot; {subject || "Session"}
                </p>
              </div>

              {/* Peer card */}
              <div className="mx-4 mt-4">
                <div
                  className="group flex items-center gap-3 p-3 rounded-xl transition-colors
                    bg-primary/5 border border-primary/10
                    dark:bg-primary/10 dark:border-primary/20
                    cursor-default relative overflow-hidden"
                >
                  <div className="relative shrink-0">
                    {peer.image ? (
                      <img
                        src={peer.image}
                        alt={peer.name}
                        className="rounded-full size-12 object-cover border-2 border-white/10"
                      />
                    ) : (
                      <div className="rounded-full size-12 bg-[#7C3AED]   flex items-center justify-center text-white font-bold">
                        {peer.name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1c1427] animate-pulse" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 z-10">
                    <h3 className="text-slate-900 dark:text-white font-semibold text-sm truncate">
                      {peer.name}
                    </h3>
                    <p className="text-slate-500 dark:text-white/40 text-xs">
                      Connected &middot; {formatTime(seconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session info */}
              <div className="mx-4 mt-6 flex-1">
                <div
                  className="p-4 rounded-xl transition-colors
                    bg-slate-50 border border-slate-200
                    dark:bg-white/5 dark:border-white/5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
                    Session Info
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-white/50">Mode</span>
                      <span className="font-medium text-slate-700 dark:text-white/80">
                        Chat
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-white/50">Timer</span>
                      <span className="font-mono text-primary">
                        {formatTime(seconds)}
                      </span>
                    </div>
                    {subject && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-white/50">Subject</span>
                        <span className="font-medium text-slate-700 dark:text-white/80">
                          {subject}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* End session btn at bottom of sidebar */}
              <div className="p-4">
                <button
                  onClick={onEndSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7C3AED]   border border-red-500/20 text-red-600 dark:text-red-300 text-sm font-bold   transition-all"
                >
                  <PhoneOff size={16} />
                  End Session
                </button>
              </div>
            </aside>

            {/* Main chat area */}
            <main
              className="flex-1 flex flex-col rounded-2xl glass-panel relative overflow-hidden shadow-2xl
                border-slate-200 dark:border-white/10"
            >
              <ChatPanel peer={peer} currentUser={currentUser} />
            </main>
          </div>
        )}
      </main>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  VIDEO GRID
// ════════════════════════════════════════════════════════════════════

function VideoGrid({
  peer,
  currentUser,
  isMuted,
  isVideoOff,
}: {
  peer: PeerInfo;
  currentUser: PeerInfo;
  isMuted: boolean;
  isVideoOff: boolean;
}) {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Peer video */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 shadow-sm">
        {peer.image ? (
          <img
            src={peer.image}
            alt={peer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#7C3AED]  ">
            <span className="text-5xl font-bold text-primary/60">
              {peer.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-white/80 text-slate-900 dark:bg-black/50 dark:text-white">
          {peer.name}
        </div>
      </div>

      {/* Self video */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 shadow-sm">
        {isVideoOff ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-zinc-900">
            <VideoOff size={40} className="text-slate-400 dark:text-white/20" />
            <span className="text-sm text-slate-500 dark:text-white/40">Camera off</span>
          </div>
        ) : currentUser.image ? (
          <img
            src={currentUser.image}
            alt={currentUser.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#7C3AED]  ">
            <span className="text-5xl font-bold text-primary/60">
              {currentUser.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-white/80 text-slate-900 dark:bg-black/50 dark:text-white">
            You
          </span>
          {isMuted && (
            <span className="px-2 py-1.5 rounded-lg backdrop-blur-md bg-red-500/80 text-white">
              <MicOff size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CHAT PANEL
// ════════════════════════════════════════════════════════════════════

function ChatPanel({
  peer,
  currentUser,
}: {
  peer: PeerInfo;
  currentUser: PeerInfo;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "sys-1", sender: "system", text: "Session started", time: "" },
    {
      id: "peer-1",
      sender: "peer",
      text: `Hey! Ready to study?`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `me-${Date.now()}`,
        sender: "me",
        text: trimmed,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex justify-between items-center transition-colors
          bg-white/60 border-slate-100
          dark:bg-white/[0.02] dark:border-white/5"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span
                  className="text-[10px] px-2 py-1 rounded-full transition-colors
                    bg-slate-100 text-slate-500
                    dark:bg-white/5 dark:text-white/30"
                >
                  {msg.text}
                </span>
              </div>
            );
          }
          if (msg.sender === "peer") {
            return (
              <div key={msg.id} className="flex gap-3">
                {peer.image ? (
                  <img
                    src={peer.image}
                    alt={peer.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {peer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div
                    className="rounded-2xl rounded-tl-none p-3 text-sm max-w-[85%] border shadow-sm transition-colors
                      bg-white text-slate-700 border-slate-100
                      dark:bg-[#1f192b] dark:text-gray-200 dark:border-white/5"
                  >
                    <p>{msg.text}</p>
                  </div>
                  {msg.time && (
                    <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1 ml-1">
                      {msg.time}
                    </p>
                  )}
                </div>
              </div>
            );
          }
          // "me"
          return (
            <div key={msg.id} className="flex flex-row-reverse gap-3">
              <div>
                <div
                  className="rounded-2xl rounded-tr-none p-3 text-sm text-white max-w-[85%] shadow-md transition-colors
                    bg-purple-600 dark:bg-primary"
                >
                  <p>{msg.text}</p>
                </div>
                {msg.time && (
                  <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1 text-right mr-1">
                    {msg.time}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t transition-colors
          bg-white border-slate-100
          dark:bg-[#130d1a] dark:border-white/5"
      >
        <div
          className="relative flex items-center gap-2 rounded-full px-2 py-1 pr-1 border transition-colors
            bg-slate-50 border-slate-200
            dark:bg-[#1a1524] dark:border-white/10"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 focus:outline-none py-2.5 pl-3 transition-colors
              text-slate-900 placeholder-slate-400
              dark:text-white dark:placeholder-white/30"
          />
          <button
            onClick={sendMessage}
            className="p-2.5 rounded-full text-white transition-colors bg-purple-600 hover:bg-purple-700 dark:bg-primary dark:hover:bg-primary-soft"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CONTROL BUTTON (video bar)
// ════════════════════════════════════════════════════════════════════

function ControlBtn({
  isActive,
  onClick,
  iconOn: IconOn,
  iconOff: IconOff,
}: {
  isActive: boolean;
  onClick: () => void;
  iconOn: React.ComponentType<{ size?: number }>;
  iconOff: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          : "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
      }`}
    >
      {isActive ? <IconOn size={20} /> : <IconOff size={20} />}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
//  POST-SESSION REVIEW
// ════════════════════════════════════════════════════════════════════

function PostSessionReview({
  peer,
  subject,
  duration,
  onDone,
}: {
  peer: PeerInfo;
  subject: string;
  duration: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const tags = [
    "Great Explainer",
    "Patient",
    "Focused",
    "Collaborative",
    "Encouraging",
    "On Time",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => onDone(), 1500);
  };

  const activeRating = hoveredRating || rating;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50 dark:bg-[#0f0a16] transition-colors overflow-hidden">
      {/* BG particles */}
      <SparkParticles />

      <div className="relative w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 z-10">
        {/* ── Sidebar (session rewards) ─────────────────────────── */}
        <aside className="md:w-80 flex flex-col gap-6 order-2 md:order-1">
          {/* Rewards card */}
          <div
            className="glass-panel rounded-2xl p-6 relative overflow-hidden group
              border-slate-200 dark:border-white/10"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#7C3AED]   " />
            <h3 className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
              Session Rewards
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                  <Sparkles
                    size={20}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
                <div>
                  <p className="text-2xl font-serif font-semibold text-slate-900 dark:text-white">
                    +30 XP
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    Session completion
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-500/10">
                  <Gem
                    size={20}
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                </div>
                <div>
                  <p className="text-2xl font-serif font-semibold text-slate-900 dark:text-white">
                    5 Coins
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    Collaboration bonus
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div
            className="glass-panel rounded-2xl p-6
              border-slate-200 dark:border-white/10"
          >
            <h3 className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-wider mb-4">
              Session Stats
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-white/50">Duration</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-white">
                  {duration}
                </span>
              </div>
              {subject && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Subject</span>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {subject}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-white/50">Partner</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {peer.name}
                </span>
              </div>
            </div>
          </div>

          {/* Back link */}
          <BackButton
            onClick={onDone}
            label="Back to Study Buddy"
            className="text-slate-500 dark:text-white/40 hover:text-primary dark:hover:text-primary"
          />
        </aside>

        {/* ── Main review card ─────────────────────────────────── */}
        <main
          className="flex-1 glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden order-1 md:order-2 shadow-2xl
            border-slate-200 dark:border-white/10"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none dark:bg-primary/20" />

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Heading */}
                <div className="mb-2">
                  <Award
                    size={32}
                    className="mx-auto mb-3 text-primary"
                  />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2 tracking-tight text-[#7C3AED]">
                  Celebrate the Exchange
                </h1>
                <p className="text-slate-500 dark:text-white/60 text-sm max-w-md mx-auto">
                  How was your study session with{" "}
                  <span className="font-semibold text-slate-700 dark:text-white/80">
                    {peer.name}
                  </span>
                  ?
                </p>

                {/* Crystal rating */}
                <div className="my-10 flex items-center justify-center gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <CrystalStar
                      key={level}
                      level={level}
                      filled={level <= activeRating}
                      onClick={() => setRating(level)}
                      onHover={() => setHoveredRating(level)}
                      onLeave={() => setHoveredRating(0)}
                    />
                  ))}
                </div>

                {activeRating > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium text-primary mb-6"
                  >
                    {
                      [
                        "",
                        "Could be better",
                        "It was okay",
                        "Good session!",
                        "Great experience!",
                        "Absolutely stellar!",
                      ][activeRating]
                    }
                  </motion.p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
                          ${
                            active
                              ? "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40 dark:text-primary-soft shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:border-primary/20 hover:bg-primary/5 dark:bg-white/5 dark:border-white/10 dark:text-white/60 dark:hover:border-primary/20 dark:hover:bg-primary/10"
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="w-full max-w-sm py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-40
                    bg-[#7C3AED] hover:bg-purple-700
                    shadow-primary/30 dark:shadow-primary/40"
                >
                  Submit Appreciation
                </button>
                <button
                  onClick={onDone}
                  className="mt-4 text-slate-400 dark:text-white/30 text-xs hover:text-slate-600 dark:hover:text-white/50 transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="w-20 h-20 rounded-full bg-[#7C3AED]   flex items-center justify-center mb-6 shadow-lg shadow-primary/30"
                >
                  <Sparkles size={36} className="text-white" />
                </motion.div>
                <h2 className="text-2xl font-serif font-medium text-slate-900 dark:text-white mb-2">
                  Thanks for the feedback!
                </h2>
                <p className="text-slate-500 dark:text-white/50 text-sm">
                  Your appreciation has been sent to {peer.name}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CRYSTAL STAR RATING
// ════════════════════════════════════════════════════════════════════

function CrystalStar({
  level,
  filled,
  onClick,
  onHover,
  onLeave,
}: {
  level: number;
  filled: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.2, y: -4 }}
      whileTap={{ scale: 0.9 }}
      className="relative focus:outline-none"
    >
      <motion.div
        animate={
          filled
            ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.4 }}
      >
        <Star
          size={level === 3 ? 44 : level === 2 || level === 4 ? 38 : 32}
          className={`transition-all duration-300 ${
            filled
              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              : "fill-transparent text-slate-300 dark:text-white/20"
          }`}
        />
      </motion.div>
      {filled && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 text-amber-400 pointer-events-none"
        >
          <Sparkles size={12} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SPARK PARTICLES (background effect for review screen)
// ════════════════════════════════════════════════════════════════════

function SparkParticles() {
  const [particles, setParticles] = useState<
    {
      id: number;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
    }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 3,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary/30 dark:bg-primary/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -30, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

