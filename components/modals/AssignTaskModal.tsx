"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onAssigned?: () => void;
}

export default function AssignTaskModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  onAssigned,
}: AssignTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setTitle("");
    setDescription("");
    setDueDate("");
  }, [isOpen, studentId]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/mentor/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: title.trim(),
          description: description.trim(),
          dueDate,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to assign task.");
      }

      toast.success(data?.message || "Assignment sent successfully.");
      onAssigned?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#191121]"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Assign Task
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send a Focus Room task to{" "}
                  <span className="font-semibold text-[#7C3AED]">
                    {studentName}
                  </span>
                  .
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Task Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Complete integration practice set"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Add instructions, links, or success criteria..."
                  className="w-full resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3.5 text-sm text-foreground outline-none transition-shadow focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground dark:border-white/10 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || !title.trim() || !dueDate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send Assignment
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
