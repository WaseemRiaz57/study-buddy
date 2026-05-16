"use client";

import { useEffect, useState } from "react";
import { Coins, Gift, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface GiftCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export default function GiftCoinsModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
}: GiftCoinsModalProps) {
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmount("");
  }, [isOpen, recipientId]);

  if (!isOpen) return null;

  const numericAmount = Number(amount);
  const canSend = Number.isInteger(numericAmount) && numericAmount > 0;

  const sendGift = async () => {
    if (!canSend || !recipientId) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/users/${recipientId}/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to gift coins.");
      }

      toast.success(data?.message || "Coins gifted successfully.");
      window.dispatchEvent(new Event("gamification-stats-updated"));
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to gift coins."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#191121]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
              Coin Gift
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-foreground">
              Gift Coins
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send coins to{" "}
              <span className="font-semibold text-[#7C3AED]">
                {recipientName || "this user"}
              </span>
              .
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
            aria-label="Close gift modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
              <Gift size={20} />
            </div>
            <div>
              <p className="font-bold text-foreground">Amount</p>
              <p className="text-xs text-muted-foreground">
                Enter whole coins only.
              </p>
            </div>
          </div>

          <div className="relative">
            <Coins
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Coins to gift"
              className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/30 dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => void sendGift()}
            disabled={!canSend || isSending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Gift size={16} />
            )}
            Gift Coins
          </button>
        </div>
      </div>
    </div>
  );
}
