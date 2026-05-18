"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Globe, Lock, X, Check, Copy, ArrowRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateRoomModal({ isOpen, onClose, onCreated }: CreateRoomModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<"form" | "success">("form");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [privacy, setPrivacy] = useState<"public" | "invite">("public");
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const handleIgnite = async () => {
    if (!topic.trim() || !description.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      if (!session?.user?.id) {
        const message = "Could not identify the current user. Please sign in again.";
        setError(message);
        alert(message);
        return;
      }

      const generatedRoomId =
        "SB-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      const response = await fetch("/api/study-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topic.trim(),
          roomId: generatedRoomId,
          maxParticipants,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || "Failed to create room.";
        if (response.status === 403 && data?.upgradeRequired) {
          setUpgradeMessage(message);
          return;
        }
        setError(message);
        alert(message);
        return;
      }

      setRoomId(String(data?.room?.roomId || data?.roomId || generatedRoomId));
      setStep("success");
      onCreated?.();
    } catch {
      const message = "Failed to create room. Please try again.";
      setError(message);
      alert(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/dashboard/study-rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnter = () => {
    router.push(`/dashboard/study-rooms/${roomId}`);
    // Reset state after navigation (optional, depends on if modal unmounts)
    setTimeout(() => {
        onClose();
        setStep("form");
        setTopic("");
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl transform overflow-hidden rounded-2xl shadow-2xl transition-all
              bg-white border border-slate-200 
              dark:bg-[#191121] dark:border-[#8c30e8]/30"
          >
            {/* Glow Effect (Dark Mode Only) */}
            <div className="absolute -top-40 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none hidden dark:block" />

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-20 p-1 rounded-full transition-colors text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
            >
              <X size={20} />
            </button>

            <div className="relative p-8 md:p-10">
              <AnimatePresence mode="wait">
                
                {/* ─── STEP 1: CREATE FORM ─── */}
                {step === "form" ? (
                  <motion.div key="form" exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8">
                    
                    {/* Header */}
                    <div className="space-y-2 text-center">
                      <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 border shadow-sm
                        bg-purple-50 text-purple-600 border-purple-100
                        dark:bg-[#8c30e8]/20 dark:text-[#8c30e8] dark:border-[#8c30e8]/30 dark:shadow-[0_0_15px_rgba(140,48,232,0.3)]">
                        <Sparkles size={24} />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Forge a New Sanctuary</h2>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Create a focused space for you and your peers.</p>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Room Topic</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                            className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all
                                bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                                dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
                            placeholder="e.g., Calculus III Prep"
                            type="text"
                            value={topic}
                            onChange={(event) => setTopic(event.target.value)}
                            />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Description</label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none
                            bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                            dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
                          placeholder="Briefly describe the room goal, agenda, or rules..."
                          rows={3}
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Participants Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Max Participants</label>
                            <span className="text-xs font-bold px-2 py-0.5 rounded border
                                bg-purple-50 text-purple-600 border-purple-200
                                dark:bg-[#8c30e8]/10 dark:text-[#8c30e8] dark:border-[#8c30e8]/20">{maxParticipants}</span>
                            </div>
                            <input
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-[#8c30e8] bg-slate-200 dark:bg-white/10"
                            max={20}
                            min={2}
                            type="range"
                            value={maxParticipants}
                            onChange={(event) => setMaxParticipants(Number(event.target.value))}
                            />
                        </div>

                        {/* Privacy Toggle */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Privacy</label>
                            <div className="flex p-1 rounded-lg border
                                bg-slate-100 border-slate-200
                                dark:bg-white/5 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setPrivacy("public")}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
                                    privacy === "public"
                                        ? "bg-white text-purple-600 shadow-sm dark:bg-[#8c30e8] dark:text-white"
                                        : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    <Globe size={12} /> Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPrivacy("invite")}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
                                    privacy === "invite"
                                        ? "bg-white text-purple-600 shadow-sm dark:bg-[#8c30e8] dark:text-white"
                                        : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    <Lock size={12} /> Invite
                                </button>
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleIgnite}
                        disabled={!topic.trim() || !description.trim() || isCreating}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                          ${topic.trim() && description.trim() && !isCreating
                            ? "bg-[#7C3AED]   hover:shadow-purple-500/25 hover:scale-[1.02]" 
                            : "bg-slate-300 dark:bg-white/10 cursor-not-allowed text-slate-500 dark:text-gray-500"}`}
                      >
                        {isCreating ? "Forging..." : "Ignite Room"} <ArrowRight size={18} />
                      </button>
                      {error ? (
                        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : (
                  
                  /* ─── STEP 2: SUCCESS / SHARE ─── */
                  <motion.div 
                    key="success" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-8 text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center border
                        bg-green-50 text-green-600 border-green-200
                        dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                        <Check size={32} />
                    </div>
                    
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Room Ready!</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Share this ID to invite peers.</p>
                    </div>

                    {/* ID Box */}
                    <div className="p-4 rounded-xl flex items-center justify-between border
                        bg-slate-50 border-slate-200
                        dark:bg-black/40 dark:border-white/10">
                        <div className="text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Room ID</span>
                            <span className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white">{roomId}</span>
                        </div>
                        <button 
                            onClick={handleCopy}
                            className="p-2.5 rounded-lg transition-colors
                            bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200
                            dark:bg-white/10 dark:border-white/5 dark:text-gray-400 dark:hover:text-white"
                        >
                            {copied ? <Check size={20} className="text-green-500"/> : <Copy size={20} />}
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors
                            text-slate-600 hover:bg-slate-100
                            dark:text-gray-400 dark:hover:bg-white/5"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handleEnter}
                            className="flex-[2] py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                            bg-slate-900 hover:bg-slate-800
                            dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                            Enter Room
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          {upgradeMessage && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <section
                className="w-full max-w-sm rounded-3xl border border-[#7C3AED]/25 bg-white p-6 text-center shadow-2xl shadow-purple-500/20 dark:bg-[#120d1f]"
                aria-label="Upgrade required"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Upgrade to Pro
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                  {upgradeMessage}
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUpgradeMessage("")}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    Not now
                  </button>
                  <Link
                    href="/dashboard/settings/subscription"
                    prefetch={true}
                    className="min-h-[44px] flex-1 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                  >
                    View Plans
                  </Link>
                </div>
              </section>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

