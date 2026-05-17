"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { icon: TypeIcon, bg: iconBg, text: iconText } = FILE_ICON_MAP[resource.fileType] ?? FILE_ICON_MAP.OTHER;
  const isPaidLocked = resource.price > 0 && !resource.isUnlocked;

  return (
    <article
      onClick={() => router.push(`/dashboard/resources/${resource.id}`)}
      className="group relative cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5"
    >
      {/* Top row: icon + rating */}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}>
          <TypeIcon size={28} />
        </div>

        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-bold">
          <Star size={12} fill="currentColor" />
          {resource.rating.toFixed(1)}
        </div>
      </div>

      {/* Subject + Title */}
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
          {resource.subject}
        </span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 line-clamp-2 group-hover:text-[#7C3AED] transition-colors">
          {resource.title}
        </h3>
      </div>

      {/* Footer: author + downloads */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] font-bold flex items-center justify-center">
            {resource.authorAvatar}
          </span>
          <span>By {resource.author}</span>
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

      <div className="mt-4">
        {isPaidLocked ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUnlock?.(resource);
            }}
            disabled={isUnlocking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
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

