"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Star,
  Megaphone,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Users,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */
type Tab = "announcements" | "pinned_posts" | "editors_picks";
type Audience = "All Users" | "Students Only" | "Mentors Only";
type Duration = "24 Hours" | "3 Days" | "1 Week" | "Until Manually Removed";

interface Announcement {
  id: number;
  title: string;
  message: string;
  audience: Audience;
  expiresOn: string;
}

interface PinnedPost {
  id: number;
  content: string;
  author: string;
  datePinned: string;
}

interface EditorsPick {
  id: number;
  title: string;
  author: string;
  datePinned: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Welcome to Study Buddy 2.0!",
    message:
      "We're excited to launch a new version with improved study rooms, smarter AI, and a fresh look. Dive in and explore the new features!",
    audience: "All Users",
    expiresOn: "Feb 29, 2026",
  },
  {
    id: 2,
    title: "Mentor Applications Open",
    message:
      "Mentors can now apply for the Spring 2026 cohort. Check the dashboard for eligibility and application details.",
    audience: "Mentors Only",
    expiresOn: "Mar 10, 2026",
  },
  {
    id: 3,
    title: "Scheduled Maintenance",
    message:
      "The platform will be down for maintenance on March 2, 2026, from 1 AM to 3 AM UTC. Please save your work.",
    audience: "All Users",
    expiresOn: "Mar 2, 2026",
  },
];

const mockPinnedPosts: PinnedPost[] = [
  {
    id: 1,
    content:
      "Just finished an incredible deep-dive into React Server Components. The mental model shift is real!",
    author: "Sophia Chen",
    datePinned: "Feb 22, 2026",
  },
  {
    id: 2,
    content:
      "Pro tip for my students: always break down complex algorithms into sub-problems first. It saves you hours of debugging later.",
    author: "Marcus Lee",
    datePinned: "Feb 21, 2026",
  },
];

const mockEditorsPicks: EditorsPick[] = [
  {
    id: 1,
    title: "Data Structures & Algorithms Handbook",
    author: "Dr. Anika Rao",
    datePinned: "Feb 20, 2026",
  },
  {
    id: 2,
    title: "Linear Algebra Lecture Series",
    author: "James Carter",
    datePinned: "Feb 18, 2026",
  },
];

const audienceOptions: Audience[] = [
  "All Users",
  "Students Only",
  "Mentors Only",
];
const durationOptions: Duration[] = [
  "24 Hours",
  "3 Days",
  "1 Week",
  "Until Manually Removed",
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function FeaturedContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("announcements");
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>(
    mockAnnouncements
  );
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>(mockPinnedPosts);
  const [editorsPicks, setEditorsPicks] = useState<EditorsPick[]>(
    mockEditorsPicks
  );

  // Modal form state
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newAudience, setNewAudience] = useState<Audience>("All Users");
  const [newDuration, setNewDuration] = useState<Duration>("24 Hours");

  // Actions
  const handlePublishAnnouncement = () => {
    setAnnouncements((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTitle,
        message: newMessage,
        audience: newAudience,
        expiresOn: getExpiryDate(newDuration),
      },
    ]);
    setIsAnnouncementModalOpen(false);
    setNewTitle("");
    setNewMessage("");
    setNewAudience("All Users");
    setNewDuration("24 Hours");
  };

  const handleDeleteAnnouncement = (id: number) =>
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

  const handleUnpinPost = (id: number) =>
    setPinnedPosts((prev) => prev.filter((p) => p.id !== id));

  const handleRemoveEditorsPick = (id: number) =>
    setEditorsPicks((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
            Featured Content & Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what users see first on the platform.
          </p>
        </div>
        <button
          onClick={() => setIsAnnouncementModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
        >
          <Plus size={17} />
          <Megaphone size={17} />
          Create Announcement
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "announcements"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Megaphone size={15} />
          Platform Announcements
        </button>
        <button
          onClick={() => setActiveTab("pinned_posts")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "pinned_posts"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Pin size={15} />
          Pinned Community Posts
        </button>
        <button
          onClick={() => setActiveTab("editors_picks")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "editors_picks"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Star size={15} className="text-amber-500" />
          Editor's Picks (Resources)
        </button>
      </div>

      {/* ── Content Sections ── */}
      {activeTab === "announcements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="relative rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm hover:shadow-lg transition-shadow duration-200 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Megaphone size={20} className="text-purple-500" />
                <h2 className="text-lg font-bold text-foreground dark:text-white truncate">
                  {a.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {a.message}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                  <Users size={12} />
                  {a.audience}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
                  <Calendar size={12} />
                  Expires {a.expiresOn}
                </span>
              </div>
              <div className="flex items-center gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                  title="Edit"
                  // onClick={() => ...}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "pinned_posts" && (
        <div className="rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Content</span>
            <span>Author</span>
            <span>Date Pinned</span>
            <span className="text-right">Actions</span>
          </div>
          {pinnedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Pin size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No pinned posts.</p>
            </div>
          ) : (
            pinnedPosts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <p className="text-sm text-foreground dark:text-white line-clamp-2">
                  {p.content}
                </p>
                <span className="text-sm text-muted-foreground">{p.author}</span>
                <span className="text-xs text-muted-foreground">{p.datePinned}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleUnpinPost(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Pin size={13} />
                    Unpin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "editors_picks" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/10 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <span>Title</span>
            <span>Author</span>
            <span>Date Pinned</span>
            <span className="text-right">Actions</span>
          </div>
          {editorsPicks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-amber-500/80">
              <Star size={40} className="mb-3" />
              <p className="text-sm">No editor's picks yet.</p>
            </div>
          ) : (
            editorsPicks.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center border-b border-amber-500/10 last:border-b-0 hover:bg-amber-50/60 dark:hover:bg-amber-500/10 transition-colors group"
              >
                <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold line-clamp-2">
                  {e.title}
                </p>
                <span className="text-sm text-muted-foreground">{e.author}</span>
                <span className="text-xs text-muted-foreground">{e.datePinned}</span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRemoveEditorsPick(e.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Create Announcement Modal ── */}
      <AnimatePresence>
        {isAnnouncementModalOpen && (
          <motion.div
            key="announcement-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAnnouncementModalOpen(false)}
          >
            <motion.div
              key="announcement-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-primary/20 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  Create Announcement
                </h2>
                <button
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePublishAnnouncement();
                }}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as Audience)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                  >
                    {audienceOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Duration / Expiry
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value as Duration)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                  >
                    {durationOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
                  >
                    <Megaphone size={15} />
                    Publish Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to get expiry date string from duration
function getExpiryDate(duration: Duration): string {
  const now = new Date();
  switch (duration) {
    case "24 Hours":
      now.setDate(now.getDate() + 1);
      break;
    case "3 Days":
      now.setDate(now.getDate() + 3);
      break;
    case "1 Week":
      now.setDate(now.getDate() + 7);
      break;
    case "Until Manually Removed":
      return "—";
  }
  return now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
