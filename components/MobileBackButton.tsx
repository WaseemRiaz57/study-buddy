"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function MobileBackButton({
  className = "",
  label = "Go back",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={label}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/10 ${className}`}
    >
      <ArrowLeft size={20} />
    </button>
  );
}
