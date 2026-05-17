"use client";

import { BookOpen, Sparkles } from "lucide-react";

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED] shadow-lg shadow-purple-500/20">
        <BookOpen className="h-5 w-5 text-white" strokeWidth={2.5} />
        <Sparkles
          className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-white text-white"
          strokeWidth={2.5}
        />
      </span>
      {!compact && (
        <span className="truncate text-lg font-black tracking-tight text-[#7C3AED]">
          StudyBuddy
        </span>
      )}
    </span>
  );
}
