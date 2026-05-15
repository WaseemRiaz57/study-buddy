"use client";

import { useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

type MentorProfileSummary = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
};

export type PaymentSession = {
  _id: string;
  subject: string;
  mentorProfile?: MentorProfileSummary | null;
  mentorId?: {
    name?: string;
  } | string;
};

type PaymentModalProps = {
  isOpen: boolean;
  session: PaymentSession | null;
  onClose: () => void;
  onUploaded: (session: unknown) => void;
};

function getMentorName(session: PaymentSession | null) {
  return typeof session?.mentorId === "object" && session.mentorId !== null
    ? session.mentorId.name || "Mentor"
    : "Mentor";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read receipt image."));
    reader.readAsDataURL(file);
  });
}

export default function PaymentModal({
  isOpen,
  session,
  onClose,
  onUploaded,
}: PaymentModalProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bankDetails = session?.mentorProfile;
  const mentorName = getMentorName(session);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image receipt.");
      return;
    }

    setReceiptFile(file);
  }

  async function handleSubmit() {
    if (!session || !receiptFile || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const paymentReceipt = await readFileAsDataUrl(receiptFile);

      const response = await fetch(`/api/sessions/${session._id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceipt }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Could not upload receipt.");
      }

      toast.success("Receipt uploaded successfully!");
      onUploaded(result?.session);
      setReceiptFile(null);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload receipt."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-surface-dark"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#7C3AED]">
                  Manual Payment
                </p>
                <h2
                  id="payment-modal-title"
                  className="mt-1 text-xl font-black text-slate-950 dark:text-white"
                >
                  Pay {mentorName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{session.subject}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-purple-50 hover:text-[#7C3AED] disabled:opacity-50"
                aria-label="Close payment modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-black text-[#7C3AED]">
                  <CreditCard className="h-5 w-5" />
                  Banking Details
                </div>
                <div className="grid gap-3 text-sm text-slate-700">
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-400">
                      Bank Name
                    </span>
                    {bankDetails?.bankName || "Not provided"}
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-400">
                      Account Title
                    </span>
                    {bankDetails?.accountTitle || mentorName}
                  </div>
                  <div>
                    <span className="block text-xs font-black uppercase text-slate-400">
                      Account Number
                    </span>
                    <span className="break-words">
                      {bankDetails?.accountNumber || "Not provided"}
                    </span>
                  </div>
                </div>
              </section>

              <label className="block rounded-2xl border border-dashed border-purple-200 bg-white p-5 text-center transition-colors hover:bg-purple-50">
                <Upload className="mx-auto mb-2 h-6 w-6 text-[#7C3AED]" />
                <span className="block text-sm font-bold text-slate-900">
                  {receiptFile ? receiptFile.name : "Upload receipt screenshot"}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  PNG, JPG, or WEBP image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSubmitting}
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!receiptFile || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Receipt
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
