"use client";

import Link from "next/link";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  Star,
  Coins,
  LockKeyhole,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface Resource {
  id: string;
  title: string;
  subject: string;
  fileType: "PDF" | "DOC" | "XLS" | "IMG" | "OTHER";
  rating: number;
  author: string;
  authorAvatar: string;
  downloads: number;
  price: number;
  isUnlocked: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const FILE_ICON_MAP: Record<Resource["fileType"], { icon: LucideIcon; bg: string; text: string }> = {
  PDF:   { icon: FileText,        bg: "bg-red-50 dark:bg-red-500/10",    text: "text-red-500 dark:text-red-400" },
  DOC:   { icon: FileText,        bg: "bg-blue-50 dark:bg-blue-500/10",  text: "text-blue-500 dark:text-blue-400" },
  XLS:   { icon: FileSpreadsheet, bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
  IMG:   { icon: FileImage,       bg: "bg-violet-50 dark:bg-violet-500/10",   text: "text-violet-500 dark:text-violet-400" },
  OTHER: { icon: File,            bg: "bg-slate-100 dark:bg-white/10",   text: "text-slate-500 dark:text-slate-400" },
};

function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ResourceCard({
  resource,
  onUnlock,
  isUnlocking = false,
}: {
  resource: Resource;
  onUnlock?: (resource: Resource) => void;
  isUnlocking?: boolean;
}) {
  const { icon: TypeIcon, bg: iconBg, text: iconText } = FILE_ICON_MAP[resource.fileType] ?? FILE_ICON_MAP.OTHER;
  const isPaidLocked = resource.price > 0 && !resource.isUnlocked;

  return (
    <article
      className="group relative h-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/25 hover:shadow-lg hover:shadow-purple-500/5 dark:border-white/10 dark:bg-white/5"
    >
      <Link
        href={`/dashboard/resources/${resource.id}`}
        aria-label={`View ${resource.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60"
      >
        <span className="sr-only">View {resource.title}</span>
      </Link>
      {/* Document preview */}
      <div className={`relative mb-4 flex h-24 items-center justify-center overflow-hidden rounded-xl border border-current/5 ${iconBg} ${iconText}`}>
        <div aria-hidden="true" className="absolute -right-5 -top-8 h-24 w-24 rounded-full border-[16px] border-current opacity-[0.06]" />
        <div aria-hidden="true" className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-current opacity-[0.05]" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-current/10 dark:bg-slate-950/35">
          <TypeIcon size={28} aria-hidden="true" />
        </div>
        <span className="absolute bottom-2.5 left-3 text-[10px] font-black uppercase tracking-[0.16em]">
          {resource.fileType}
        </span>
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-white/85 px-2 py-1 text-xs font-bold text-amber-600 shadow-sm dark:bg-slate-950/70 dark:text-amber-400">
          <Star size={12} fill="currentColor" />
          {resource.rating.toFixed(1)}
        </div>
      </div>

      {/* Subject + Title */}
      <div className="mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
          {resource.subject}
        </span>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-[#7C3AED] dark:text-white">
          {resource.title}
        </h3>
      </div>

      {/* Footer: author + downloads */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] font-bold flex items-center justify-center">
            {resource.authorAvatar}
          </span>
          <span className="max-w-24 truncate">By {resource.author}</span>
        </div>

        <div className="flex items-center gap-2">
          {resource.price > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 font-bold text-[#7C3AED]">
              <Coins size={12} />
              {resource.price}
            </span>
          )}
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Download size={12} />
            {formatDownloads(resource.downloads)}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {isPaidLocked ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUnlock?.(resource);
            }}
            disabled={isUnlocking}
            className="relative z-20 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LockKeyhole size={15} />
            {isUnlocking ? "Unlocking..." : `Unlock for ${resource.price} Coins`}
          </button>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors group-hover:border-[#7C3AED]/40 group-hover:text-[#7C3AED] dark:border-white/10 dark:text-slate-300">
            <Download size={15} />
            View Resource
          </div>
        )}
      </div>
    </article>
  );
}

