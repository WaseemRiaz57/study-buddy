"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X, Check, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MatchRequest {
  sessionId: string;
  requester: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  subject: string;
  topic: string;
}

interface MatchRequestNotificationProps {
  request: MatchRequest;
  onAcceptedAction: (sessionId: string, peerName: string, peerImage: string) => void;
  onDeclinedAction: (sessionId: string) => void;
}

export default function MatchRequestNotification({
  request,
  onAcceptedAction,
  onDeclinedAction,
}: MatchRequestNotificationProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [respondingAction, setRespondingAction] = useState<"accept" | "reject" | null>(null);

  const handleRespond = async (action: "accept" | "reject") => {
    setIsResponding(true);
    setRespondingAction(action);

    try {
      const res = await fetch("/api/study-buddy/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: request.sessionId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to respond");
      }

      if (action === "accept") {
        toast.success(`Connected with ${request.requester.name}!`);
        onAcceptedAction(
          request.sessionId,
          data.peer?.name || request.requester.name,
          data.peer?.image || request.requester.image
        );
      } else {
        toast.info("Request declined.");
        onDeclinedAction(request.sessionId);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      setIsResponding(false);
      setRespondingAction(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-3rem)]"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-[#1a1523]/80 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
          {/* Glow accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center overflow-hidden">
                {request.requester.image ? (
                  <img
                    src={request.requester.image}
                    alt={request.requester.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserPlus className="h-5 w-5 text-purple-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {request.requester.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  wants to study with you
                </p>
              </div>

              {/* Pulsing indicator */}
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
              </span>
            </div>

            {/* Subject/Topic tags */}
            {(request.subject || request.topic) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {request.subject && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                    <BookOpen className="h-3 w-3" />
                    {request.subject}
                  </span>
                )}
                {request.topic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 text-xs font-medium text-pink-700 dark:text-pink-300">
                    {request.topic}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRespond("reject")}
                disabled={isResponding}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:border-red-500/20 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResponding && respondingAction === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Decline
              </button>

              <button
                onClick={() => handleRespond("accept")}
                disabled={isResponding}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResponding && respondingAction === "accept" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Accept
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
