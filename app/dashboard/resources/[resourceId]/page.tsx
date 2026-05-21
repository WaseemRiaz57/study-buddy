"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Coins,
  Star,
  Eye,
  FileText,
  HardDrive,
  BookOpen,
  Calendar,
  Flag,
  Share2,
  ThumbsUp,
  MessageSquare,
  LockKeyhole,
  Loader2,
} from "lucide-react";
import FlagResourceModal from "@/components/resources/FlagResourceModal";
import RateResourceModal from "@/components/resources/RateResourceModal";

interface ApiResource {
  _id: string;
  title: string;
  subject: string;
  description: string;
  tags: string[];
  fileUrl?: string;
  fileSize: string;
  fileType: string;
  pageCount: number;
  rating: number;
  averageRating?: number;
  ratingCount?: number;
  downloadCount: number;
  price: number;
  isUnlocked: boolean;
  createdAt: string;
  uploadedBy?: {
    name?: string;
  };
}

function formatDate(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Star helper                                                        */
/* ------------------------------------------------------------------ */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.round(rating)
              ? "text-amber-500 fill-amber-500"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resourceId = params.resourceId as string;

  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [resources, setResources] = useState<ApiResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/resources", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch resources.");
        }

        const data = (await response.json()) as ApiResource[];
        setResources(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch resources.");
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResources();
  }, []);

  const resource = useMemo(
    () => resources.find((item) => item._id === resourceId),
    [resources, resourceId]
  );

  const authorName = resource?.uploadedBy?.name?.trim() || "Unknown User";
  const authorAvatar = getInitials(authorName);
  const isPaidLocked = Boolean(resource && resource.price > 0 && !resource.isUnlocked);

  const handleDownload = () => {
    if (!resource?.fileUrl || !resource.isUnlocked) return;

    const downloadUrl = resource.fileUrl.replace("/upload/", "/upload/fl_attachment/");
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.setAttribute("download", "");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setIsRatingOpen(true);
  };

  const handleUnlock = async () => {
    if (!resource) return;

    if (!window.confirm(`Unlock "${resource.title}" for ${resource.price} coins?`)) {
      return;
    }

    try {
      setIsUnlocking(true);
      const response = await fetch(`/api/resources/${resource._id}/purchase`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to unlock resource.");
      }

      setResources((current) =>
        current.map((item) =>
          item._id === resource._id
            ? {
                ...item,
                isUnlocked: true,
                fileUrl: data?.fileUrl || item.fileUrl,
              }
            : item
        )
      );
      window.dispatchEvent(new Event("gamification-stats-updated"));
      toast.success(data?.message || "Resource unlocked.");
      setIsRatingOpen(true);
    } catch (unlockError) {
      toast.error(
        unlockError instanceof Error
          ? unlockError.message
          : "Failed to unlock resource."
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading resource...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
        <button
          onClick={() => router.push("/dashboard/resources")}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Resource Hub
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resource not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
      {/* ---- Back button ---- */}
      <button
        onClick={() => router.push("/dashboard/resources")}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#7C3AED] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Resource Hub
      </button>

      {/* ---- Main card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row rounded-2xl overflow-hidden bg-white dark:bg-[#191121] shadow-2xl border border-slate-200 dark:border-white/10"
      >
        {/* ---- Left: Preview pane ---- */}
        <div className="w-full lg:w-5/12 bg-slate-100 dark:bg-white/5 relative flex items-center justify-center min-h-[320px]">
          {/* Blurred "document" visual */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-48 h-64 rounded-lg bg-[#7C3AED] blur-sm" />
          </div>

          <div className="relative text-center z-10">
            <div className="bg-white dark:bg-white/10 p-4 rounded-full mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Eye size={28} className="text-slate-700 dark:text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {resource.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {resource.description}
            </p>
            {resource.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/15 text-slate-700 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---- Right: Details ---- */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Subject badge */}
          <span className="inline-block text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-lg uppercase tracking-wider">
            {resource.subject}
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mt-3 mb-2 text-slate-900 dark:text-white">
            {resource.title}
          </h1>

          {/* Rating row */}
          <div className="flex items-center gap-3 mb-6">
            <Stars rating={resource.rating} />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {resource.rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({resource.downloadCount} downloads)
            </span>
          </div>

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { icon: FileText, label: resource.fileType },
              { icon: HardDrive, label: resource.fileSize },
              { icon: BookOpen, label: `${resource.pageCount} pages` },
              {
                icon: Coins,
                label:
                  resource.price > 0
                    ? `${resource.price} coins`
                    : "Free",
              },
              { icon: Calendar, label: formatDate(resource.createdAt) },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400"
              >
                <m.icon size={14} />
                {m.label}
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
            {resource.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] text-sm font-bold flex items-center justify-center">
              {authorAvatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {authorName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contributor
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {isPaidLocked ? (
              <button
                onClick={() => void handleUnlock()}
                disabled={isUnlocking}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#7C3AED] text-white font-bold shadow-lg shadow-purple-500/20 transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUnlocking ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LockKeyhole size={18} />
                )}
                {isUnlocking ? "Unlocking..." : `Unlock for ${resource.price} Coins`}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg hover:bg-emerald-700 transition-colors"
              >
                <Download size={18} />
                Download Resource
              </button>
            )}

            <button className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Share2 size={16} /> Share
            </button>

            <button
              onClick={() => setIsFlagOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Flag size={16} /> Report
            </button>
          </div>

          {/* ---- Reviews section ---- */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={18} />
              Reviews (0)
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400">
              No reviews yet.
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Flag Modal ---- */}
      <FlagResourceModal
        isOpen={isFlagOpen}
        onClose={() => setIsFlagOpen(false)}
        resourceTitle={resource.title}
      />
      <RateResourceModal
        resourceId={isRatingOpen ? resource._id : null}
        resourceTitle={resource.title}
        onClose={() => setIsRatingOpen(false)}
        onRated={(averageRating) => {
          setResources((current) =>
            current.map((item) =>
              item._id === resource._id
                ? { ...item, rating: averageRating, averageRating }
                : item
            )
          );
        }}
      />
    </div>
  );
}

