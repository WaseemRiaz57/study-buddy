"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface FlagResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const REASONS = [
  "Inappropriate Content",
  "Copyright Violation",
  "Spam or Misleading",
  "Low Quality / Irrelevant",
  "Duplicate Resource",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function FlagResourceModal({
  isOpen,
  onClose,
  resourceTitle,
}: FlagResourceModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;
    // In a real app this would send to an API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason("");
      setDetails("");
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="flag-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="flag-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#191121] border border-red-100 dark:border-red-900/30 rounded-2xl p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Report Content
              </h3>
              {resourceTitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  &ldquo;{resourceTitle}&rdquo;
                </p>
              )}
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  ✓
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">Report submitted</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Thanks for helping keep the library safe.
                </p>
              </div>
            ) : (
              <>
                {/* Reason options */}
                <div className="space-y-2 mb-4">
                  {REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReason === reason
                          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
                          : "border-slate-200 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="flag-reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="accent-red-600"
                      />
                      <span className="text-slate-700 dark:text-slate-200 text-sm">
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Additional details */}
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 mb-4"
                  placeholder="Any additional details (optional)…"
                />

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
                >
                  Submit Report
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

