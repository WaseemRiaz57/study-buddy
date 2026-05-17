"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  Loader2,
  Megaphone,
  Pin,
  Plus,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";

type Tab = "announcements" | "pinned_posts" | "editors_picks";
type TargetAudience = "all" | "students" | "mentors";

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
};

const audienceLabels: Record<TargetAudience, string> = {
  all: "All Users",
  students: "Students Only",
  mentors: "Mentors Only",
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function FeaturedContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAudience, setNewAudience] = useState<TargetAudience>("all");
  const [newExpiryDate, setNewExpiryDate] = useState(getDefaultExpiryDate());

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/announcements", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load announcements.");
      }

      setAnnouncements(
        Array.isArray(data.announcements) ? data.announcements : []
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load announcements."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  function resetForm() {
    setNewTitle("");
    setNewContent("");
    setNewAudience("all");
    setNewExpiryDate(getDefaultExpiryDate());
  }

  function openCreateModal() {
    resetForm();
    setIsAnnouncementModalOpen(true);
  }

  async function handlePublishAnnouncement() {
    setIsSaving(true);

    try {
      const expiresAt = new Date(`${newExpiryDate}T23:59:59`);
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          targetAudience: newAudience,
          expiresAt: expiresAt.toISOString(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create announcement.");
      }

      toast.success("Announcement created.");
      setIsAnnouncementModalOpen(false);
      resetForm();
      await fetchAnnouncements();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create announcement."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAnnouncement() {
    if (!deleteTarget) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/announcements/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete announcement.");
      }

      toast.success("Announcement deleted.");
      setDeleteTarget(null);
      await fetchAnnouncements();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete announcement."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white md:text-3xl">
            Featured Content & Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what users see first on the platform.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/20 transition-colors hover:bg-[#6D28D9]"
        >
          <Plus size={17} />
          <Megaphone size={17} />
          Create Announcement
        </button>
      </div>

      <div className="flex w-fit gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.04]">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === "announcements"
              ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
              : "text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
          }`}
        >
          <Megaphone size={15} />
          Platform Announcements
        </button>
        <button
          onClick={() => setActiveTab("pinned_posts")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === "pinned_posts"
              ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
              : "text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
          }`}
        >
          <Pin size={15} />
          Pinned Community Posts
        </button>
        <button
          onClick={() => setActiveTab("editors_picks")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === "editors_picks"
              ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
              : "text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white"
          }`}
        >
          <Star size={15} className="text-amber-500" />
          Editor's Picks
        </button>
      </div>

      {activeTab === "announcements" && (
        <div>
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-white dark:bg-white/[0.02]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#7C3AED]" />
              <span className="text-sm font-medium text-muted-foreground">
                Loading announcements...
              </span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-muted-foreground">
              <Megaphone size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No announcements have been published.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="group relative rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <Megaphone size={20} className="text-[#7C3AED]" />
                    <h2 className="truncate text-lg font-bold text-foreground dark:text-white">
                      {announcement.title}
                    </h2>
                  </div>
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                    {announcement.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold text-[#7C3AED]">
                      <Users size={12} />
                      {audienceLabels[announcement.targetAudience]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-white">
                      <Calendar size={12} />
                      Expires {formatDate(announcement.expiresAt)}
                    </span>
                  </div>
                  <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title="Delete"
                      onClick={() => setDeleteTarget(announcement)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "pinned_posts" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-16 text-muted-foreground dark:bg-white/[0.02]">
          <Pin size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Pinned community content is not configured yet.</p>
        </div>
      )}

      {activeTab === "editors_picks" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 py-16 text-amber-600 dark:text-amber-300">
          <Star size={40} className="mb-3" />
          <p className="text-sm">Editor's picks are not configured yet.</p>
        </div>
      )}

      <AnimatePresence>
        {isAnnouncementModalOpen && (
          <motion.div
            key="announcement-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isSaving) setIsAnnouncementModalOpen(false);
            }}
          >
            <motion.div
              key="announcement-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#7C3AED]/20 bg-white shadow-2xl shadow-[#7C3AED]/10 dark:bg-[#0f0a16]"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  Create Announcement
                </h2>
                <button
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground disabled:opacity-60 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handlePublishAnnouncement();
                }}
                className="space-y-5 p-6"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Content
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(event) => setNewContent(event.target.value)}
                    required
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(event) =>
                      setNewAudience(event.target.value as TargetAudience)
                    }
                    className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-[#241333] dark:text-white"
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="mentors">Mentors Only</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setNewExpiryDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    disabled={isSaving}
                    className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#7C3AED]/20 transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Megaphone size={15} />
                    )}
                    Publish Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-announcement-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isSaving) setDeleteTarget(null);
            }}
          >
            <motion.div
              key="delete-announcement-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f0a16]"
            >
              <h2 className="text-lg font-bold text-foreground dark:text-white">
                Delete announcement?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will remove "{deleteTarget.title}" from every dashboard.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSaving}
                  className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAnnouncement()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
