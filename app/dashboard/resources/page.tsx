"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Library,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import ResourceCard from "@/components/resources/ResourceCard";
import type { Resource } from "@/components/resources/ResourceCard";
import RateResourceModal from "@/components/resources/RateResourceModal";
import UploadResourceModal from "@/components/resources/UploadResourceModal";
import ResourceHubLoading from "@/app/resource-hub/loading";

const SUBJECTS = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Literature",
  "History",
  "Philosophy",
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular", icon: TrendingUp },
  { label: "Newest", value: "newest", icon: Clock },
  { label: "Top Rated", value: "rating", icon: Star },
];

type FileType = Resource["fileType"];

interface ApiResource {
  _id: string;
  title: string;
  subject: string;
  fileType: string;
  rating: number;
  averageRating?: number;
  ratingCount?: number;
  downloadCount: number;
  createdAt: string;
  uploadedBy?: {
    name?: string;
  };
  price?: number;
  isUnlocked?: boolean;
}

interface ResourceItem extends Resource {
  createdAt: string;
}

function normalizeFileType(input: string): FileType {
  const type = input.toUpperCase();
  if (type.includes("PDF")) return "PDF";
  if (type.includes("DOC")) return "DOC";
  if (type.includes("XLS") || type.includes("SHEET")) return "XLS";
  if (type.includes("IMG") || type.includes("IMAGE") || type.includes("PNG") || type.includes("JPEG") || type.includes("JPG")) return "IMG";
  return "OTHER";
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [sort, setSort] = useState("popular");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockingResourceId, setUnlockingResourceId] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (subject !== "All Subjects") params.set("subject", subject);
      if (search.trim()) params.set("search", search.trim());

      const query = params.toString();
      const response = await fetch(`/api/resources${query ? `?${query}` : ""}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch resources.");
      }

      const data = (await response.json()) as ApiResource[];
      const mapped: ResourceItem[] = data.map((item) => {
        const author = item.uploadedBy?.name?.trim() || "Unknown User";
        return {
          id: item._id,
          title: item.title,
          subject: item.subject,
          fileType: normalizeFileType(item.fileType),
          rating: Number(item.averageRating ?? item.rating ?? 0),
          author,
          authorAvatar: getInitials(author),
          downloads: item.downloadCount ?? 0,
          price: Math.max(0, Number(item.price || 0)),
          isUnlocked: Boolean(item.isUnlocked || Number(item.price || 0) === 0),
          createdAt: item.createdAt,
        };
      });

      setResources(mapped);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch resources.");
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchResources();
  }, [search, subject]);

  const handleUnlockResource = async (resource: Resource) => {
    if (!window.confirm(`Unlock "${resource.title}" for ${resource.price} coins?`)) {
      return;
    }

    try {
      setUnlockingResourceId(resource.id);
      const response = await fetch(`/api/resources/${resource.id}/purchase`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to unlock resource.");
      }

      setResources((current) =>
        current.map((item) =>
          item.id === resource.id ? { ...item, isUnlocked: true } : item
        )
      );
      window.dispatchEvent(new Event("gamification-stats-updated"));
      toast.success(data?.message || "Resource unlocked.");
      setRatingTarget(resource);
    } catch (unlockError) {
      toast.error(
        unlockError instanceof Error
          ? unlockError.message
          : "Failed to unlock resource."
      );
    } finally {
      setUnlockingResourceId(null);
    }
  };

  /* ---- Filtering & sorting ---- */
  const filtered = useMemo(() => {
    let list = [...resources];

    list = [...list].sort((a, b) => {
      if (sort === "popular") return b.downloads - a.downloads;
      if (sort === "rating") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [resources, sort]);

  if (isLoading && resources.length === 0 && !error) {
    return <ResourceHubLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2 text-[#7C3AED] mb-1">
            <Library size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Digital Library
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Resource Hub
          </h1>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-colors"
        >
          <Plus size={18} />
          Upload Resource
        </button>
      </motion.div>

      {/* ---- Search & Filters bar ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 sm:flex-row"
      >
        {/* Search */}
        <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
          <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Search resources by title, subject, or author…"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Subject filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="cursor-pointer bg-transparent text-sm text-slate-600 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="dark:bg-slate-900 dark:text-slate-100">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="cursor-pointer bg-transparent text-sm text-slate-600 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-slate-900 dark:text-slate-100">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span>{" "}
        resource{filtered.length !== 1 && "s"}
      </p>

      {/* ---- Grid ---- */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">
            <Library size={28} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading resources…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Search size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No resources found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filtered.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ResourceCard
                resource={resource}
                onUnlock={handleUnlockResource}
                isUnlocking={unlockingResourceId === resource.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ---- Upload Modal ---- */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchResources}
      />
      <RateResourceModal
        resourceId={ratingTarget?.id || null}
        resourceTitle={ratingTarget?.title}
        onClose={() => setRatingTarget(null)}
        onRated={(averageRating) => {
          if (!ratingTarget) return;
          setResources((current) =>
            current.map((item) =>
              item.id === ratingTarget.id ? { ...item, rating: averageRating } : item
            )
          );
        }}
      />
    </div>
  );
}

