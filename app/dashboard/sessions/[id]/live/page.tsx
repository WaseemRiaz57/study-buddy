"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pen,
  Square,
  Eraser,
  MousePointer2,
  Type,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Layout,
  Send,
  Sparkles,
  Award,
  ChevronLeft,
  X,
  MessageSquare,
  Clock,
  TrendingUp,
  BrainCircuit,
  Lock,
  Share,
  CheckCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════ */
/* TYPES & MOCK DATA                                                */
/* ═══════════════════════════════════════════════════════════════════ */

interface ChatMessage {
  id: number;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMentor?: boolean;
}

type ToolId = "pointer" | "pen" | "shapes" | "text" | "eraser";

const boardTools: { id: ToolId; icon: React.ElementType; label: string }[] = [
  { id: "pointer", icon: MousePointer2, label: "Select" },
  { id: "pen", icon: Pen, label: "Pen" },
  { id: "shapes", icon: Square, label: "Shapes" },
  { id: "text", icon: Type, label: "Text" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
];

/* ═══════════════════════════════════════════════════════════════════ */
/* SUB-COMPONENTS                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

/** PiP video feed with glow aura */
function PipVideo({
  person,
  position,
  glowColor,
}: {
  person: { name: string; avatar: string; rank: string };
  position: string;
  glowColor: string;
}) {
  return (
    <div className={`absolute ${position} z-30`}>
      <div className="relative group">
        {/* Glow aura */}
        <div
          className={`absolute -inset-1.5 rounded-2xl ${glowColor} opacity-60 blur-md animate-pulse-slow`}
        />
        <div className="relative w-44 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 shadow-2xl">
          {/* Placeholder video */}
          <div className="absolute inset-0 bg-[#7C3AED]     flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#7C3AED]   flex items-center justify-center text-base font-bold text-white">
              {person.avatar}
            </div>
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-[#7C3AED]   p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-white">
                {person.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] text-amber-400 font-medium">
                {person.rank}
              </span>
            </div>
          </div>

          {/* Speaking indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chat bubble */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div
      className={`flex gap-2.5 ${msg.isMentor ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
          msg.isMentor
            ? "bg-[#7C3AED]   text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        {msg.avatar}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
          msg.isMentor
            ? "bg-primary/20 border border-primary/30 rounded-tr-sm"
            : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.08] rounded-tl-sm"
        }`}
      >
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.text}</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
          {msg.time}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MAIN PAGE                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export default function LiveClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const sessionId = params.id as string;

  const currentUserName = session?.user?.name || "User";
  const currentUserAvatar =
    currentUserName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  const currentUserIsMentor = session?.user?.role?.toUpperCase() === "MENTOR";

  const currentUser = {
    name: currentUserName,
    avatar: currentUserAvatar,
    rank: currentUserIsMentor ? "Mentor" : "Scholar",
  };

  const peerUser = currentUserIsMentor
    ? { name: "Student", avatar: "ST", rank: "Scholar" }
    : { name: "Mentor", avatar: "MN", rank: "Mentor" };

  const mentorInfo = currentUserIsMentor ? currentUser : peerUser;
  const studentInfo = currentUserIsMentor ? peerUser : currentUser;

  const initialMessages: ChatMessage[] = [
    {
      id: 1,
      sender: studentInfo.name,
      avatar: studentInfo.avatar,
      text: "Hi! I had a question about problem #4 from the midterm review.",
      time: "10:02",
    },
    {
      id: 2,
      sender: mentorInfo.name,
      avatar: mentorInfo.avatar,
      text: "Sure! Let me pull up that problem on the board. It's about vector field divergence, right?",
      time: "10:03",
      isMentor: true,
    },
    {
      id: 3,
      sender: studentInfo.name,
      avatar: studentInfo.avatar,
      text: "Yes exactly! I get confused when the field has multiple components.",
      time: "10:04",
    },
  ];

  const [activeTool, setActiveTool] = useState<ToolId>("pen");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMsg, setNewMsg] = useState("");
  
  // Modal State
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [mentorInfo.name, mentorInfo.avatar, studentInfo.name, studentInfo.avatar]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: currentUser.name,
        avatar: currentUser.avatar,
        text: newMsg.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMentor: currentUserIsMentor,
      },
    ]);
    setNewMsg("");
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  const handleFinalize = () => {
    // You can also add logic to save notes here before redirecting
    router.push("/dashboard/sessions");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-white relative flex">
      {/* ── CENTER STAGE: Whiteboard ──────────────────────────── */}
      <div className="flex-1 relative">
        {/* Dot grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "rgba(124,58,237,0.08)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* ── Left Toolbar ────────────────────────────────────── */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-30 flex flex-col gap-1 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 shadow-2xl">
          {boardTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* ── PiP Video Feeds ─────────────────────────────────── */}
        <PipVideo
          person={mentorInfo}
          position="top-4 right-4"
          glowColor="bg-primary/40"
        />
        <PipVideo
          person={studentInfo}
          position="top-40 right-4"
          glowColor="bg-pink-500/40"
        />

        {/* ── Back link (small) ────────────────────────────────── */}
        <Link
          href={`/dashboard/sessions/${sessionId}/prep`}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prep
        </Link>

        {/* ── Bottom Control Dock ─────────────────────────────── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-3 shadow-2xl">
            {/* Mic */}
            <button
              onClick={() => setMicOn(!micOn)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                micOn
                  ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {micOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Camera */}
            <button
              onClick={() => setCamOn(!camOn)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                camOn
                  ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {camOn ? (
                <VideoIcon className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </button>

            {/* Board toggle */}
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all">
              <Layout className="w-5 h-5" />
            </button>

            {/* Screen share */}
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 transition-all">
              <ScreenShare className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />

            {/* Chat toggle */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                chatOpen
                  ? "bg-primary/20 text-primary"
                  : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />

            {/* 👇 END CALL BUTTON TRIGGERING MODAL 👇 */}
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR: Live Chat ──────────────────────────── */}
      {chatOpen && (
        <aside className="w-[360px] shrink-0 flex flex-col border-l border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Chat</h3>
              <span className="ml-1 flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {/* AI Study Tip insight */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  AI Study Tip
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Based on the student&apos;s recent performance, consider using a visual
                approach with vector field plots. Students with similar profiles
                show 40% better retention with graphical aids.
              </p>
            </div>

            <div ref={chatEndRef} />
          </div>

          {/* Sticky input */}
          <div className="border-t border-slate-200 dark:border-white/[0.08] p-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/5 px-3 py-2 focus-within:border-primary/50 transition-colors">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
              <button
                onClick={sendMessage}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── END SESSION SUMMARY MODAL (Overlay) ──────────────────── */}
      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-[960px] max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex flex-col gap-1 p-5 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-[#7C3AED]">
                      Session Concluded
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 font-normal text-base">Excellent work! Here is your session summary log.</p>
                  </div>
                  {/* Reward Toast */}
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                    <Award className="text-emerald-400 w-5 h-5" />
                    <span className="text-emerald-100 font-medium text-sm tracking-wide">+25 Mentor Influence XP</span>
                  </div>
                </div>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-5 pt-4">
                {/* Impact Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Metric 1 */}
                  <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                      <Clock className="text-slate-500 dark:text-white w-8 h-8" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Duration</p>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold">62<span className="text-base font-medium text-slate-400 ml-1">min</span></p>
                  </div>
                  {/* Metric 2 */}
                  <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                      <BrainCircuit className="text-slate-500 dark:text-white w-8 h-8" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Focus Score</p>
                    <p className="text-slate-900 dark:text-white text-2xl font-bold">94<span className="text-base font-medium text-slate-400 ml-1">%</span></p>
                  </div>
                  {/* Metric 3 */}
                  <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                      <TrendingUp className="text-slate-500 dark:text-white w-8 h-8" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Knowledge Gained</p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-2xl font-bold drop-shadow-sm">+45<span className="text-base font-medium text-slate-400 ml-1">XP</span></p>
                  </div>
                </div>

                {/* AI Summary Section */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-primary w-5 h-5" />
                    <h3 className="text-slate-900 dark:text-white text-base font-bold">AI Summary Preview</h3>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">Key topics covered:</strong> Thermodynamics, Entropy concepts. <br /><br />
                      The student demonstrated strong problem-solving skills in the second half, particularly when applying the second law of thermodynamics. 
                      <br /><br />
                      <span className="text-slate-500 dark:text-slate-400">Recommended focus for next session: </span>
                      <span className="text-primary font-medium">Heat transfer equations and practical applications.</span>
                    </p>
                  </div>
                </div>

                {/* Private Notes Section */}
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-medium" htmlFor="notes">
                    <Lock className="text-slate-400 w-5 h-5" />
                    Private Educator Notes
                  </label>
                  <div className="relative group">
                    <textarea 
                      className="w-full min-h-[120px] resize-none rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-4 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all hover:bg-slate-100 dark:hover:bg-white/10" 
                      id="notes" 
                      placeholder="Add private observations for future sessions... (e.g., student seemed tired today, review specific formulas next time)"
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-slate-400 dark:text-slate-500 text-xs">Only visible to you</div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button 
                  onClick={() => setIsSummaryOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 group"
                >
                  <Share className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Cancel & Return
                </button>
                <button 
                  onClick={handleFinalize}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#7C3AED]   text-white font-bold shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Finalize & Log Session
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
