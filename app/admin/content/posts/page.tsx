"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Trash2,
  Pin,
  Edit,
  MoreVertical,
  MessageSquare,
  Heart,
  ShieldAlert,
  X,
  EyeOff,
  ChevronDown,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type PostStatus = "published" | "flagged" | "hidden";
type Role = "student" | "mentor" | "admin";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  role: Role;
  content: string;
  hearts: number;
  commentCount: number;
  status: PostStatus;
  date: string;
  pinned: boolean;
  comments: Comment[];
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockPosts: Post[] = [
  {
    id: 1,
    author: "Sophia Chen",
    avatar: "SC",
    role: "student",
    content:
      "Just finished an incredible deep-dive into React Server Components. The mental model shift is real – anyone else feeling this?",
    hearts: 42,
    commentCount: 3,
    status: "published",
    date: "Feb 22, 2026",
    pinned: true,
    comments: [
      {
        id: 101,
        author: "Liam Torres",
        avatar: "LT",
        text: "Totally agree! RSC changed how I think about data fetching entirely.",
        timestamp: "2 hours ago",
      },
      {
        id: 102,
        author: "Ava Patel",
        avatar: "AP",
        text: "I struggled at first but the streaming patterns are so elegant once you get them.",
        timestamp: "4 hours ago",
      },
      {
        id: 103,
        author: "Noah Kim",
        avatar: "NK",
        text: "Great post! Would love to see your notes on this topic.",
        timestamp: "6 hours ago",
      },
    ],
  },
  {
    id: 2,
    author: "Marcus Lee",
    avatar: "ML",
    role: "mentor",
    content:
      "Pro tip for my students: always break down complex algorithms into sub-problems first. It saves you hours of debugging later.",
    hearts: 87,
    commentCount: 4,
    status: "published",
    date: "Feb 21, 2026",
    pinned: false,
    comments: [
      {
        id: 201,
        author: "Zara Ahmed",
        avatar: "ZA",
        text: "This advice literally saved my DSA assignment. Thank you!",
        timestamp: "1 day ago",
      },
      {
        id: 202,
        author: "Ethan Brooks",
        avatar: "EB",
        text: "Can you do a session on dynamic programming next? That's where I always get stuck.",
        timestamp: "1 day ago",
      },
      {
        id: 203,
        author: "Isla Nguyen",
        avatar: "IN",
        text: "Shared this with my entire study group. Gold advice.",
        timestamp: "1 day ago",
      },
      {
        id: 204,
        author: "Oliver Grant",
        avatar: "OG",
        text: "Bookmarked! These tips are always so practical.",
        timestamp: "2 days ago",
      },
    ],
  },
  {
    id: 3,
    author: "Priya Gupta",
    avatar: "PG",
    role: "student",
    content:
      "Can someone explain the difference between useMemo and useCallback? I keep mixing them up in interviews.",
    hearts: 21,
    commentCount: 0,
    status: "published",
    date: "Feb 20, 2026",
    pinned: false,
    comments: [],
  },
  {
    id: 4,
    author: "Jake Morrison",
    avatar: "JM",
    role: "student",
    content:
      "This platform is trash and the mentors don't know what they're talking about. Total scam.",
    hearts: 2,
    commentCount: 0,
    status: "flagged",
    date: "Feb 19, 2026",
    pinned: false,
    comments: [],
  },
  {
    id: 5,
    author: "Dr. Anika Rao",
    avatar: "AR",
    role: "mentor",
    content:
      "New resource uploaded: 'Mastering System Design Interviews — 2026 Edition'. Check the resources library!",
    hearts: 134,
    commentCount: 2,
    status: "published",
    date: "Feb 18, 2026",
    pinned: true,
    comments: [
      {
        id: 501,
        author: "Carlos Rivera",
        avatar: "CR",
        text: "Just downloaded it. The distributed systems chapter is phenomenal.",
        timestamp: "3 days ago",
      },
      {
        id: 502,
        author: "Mia Johnson",
        avatar: "MJ",
        text: "Finally a resource that covers event-driven architecture properly. Thank you Dr. Rao!",
        timestamp: "4 days ago",
      },
    ],
  },
  {
    id: 6,
    author: "Riley Tanaka",
    avatar: "RT",
    role: "admin",
    content:
      "Maintenance window tonight 11 PM–1 AM UTC. Expect brief downtime. We're upgrading the real-time collaboration engine.",
    hearts: 15,
    commentCount: 0,
    status: "hidden",
    date: "Feb 17, 2026",
    pinned: false,
    comments: [],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const roleBadge: Record<Role, string> = {
  student:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  admin:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const statusStyles: Record<PostStatus, { dot: string; bg: string; text: string }> = {
  published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  flagged: {
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-400",
  },
  hidden: {
    dot: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-white/[0.06]",
    text: "text-slate-600 dark:text-slate-400",
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function CommunityPostsPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedPostForComments, setSelectedPostForComments] =
    useState<Post | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [dateDropdown, setDateDropdown] = useState(false);

  /* Derived */
  const filtered = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.author.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  /* Actions */
  const toggleSelect = (id: number) =>
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    if (selectedPosts.length === filtered.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filtered.map((p) => p.id));
    }
  };

  const handleBulkDelete = () =>
    setPosts((prev) => prev.filter((p) => !selectedPosts.includes(p.id)));

  const handleDelete = (id: number) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  const handlePin = (id: number) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    );

  const handleDeleteComment = (postId: number, commentId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.filter((c) => c.id !== commentId),
              commentCount: Math.max(0, p.commentCount - 1),
            }
          : p
      )
    );
    if (selectedPostForComments?.id === postId) {
      setSelectedPostForComments((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
              commentCount: Math.max(0, prev.commentCount - 1),
            }
          : null
      );
    }
  };

  const handleHideComment = (postId: number, commentId: number) => {
    // For demo, just remove the comment visually
    handleDeleteComment(postId, commentId);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header & Toolbar ── */}
      <div className="flex flex-col gap-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Community Posts
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
              {posts.length} Posts
            </span>
          </div>

          <AnimatePresence>
            {selectedPosts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                <Trash2 size={15} />
                Bulk Delete ({selectedPosts.length})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by author or content..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Filter: Role */}
          <FilterDropdown
            label="Role"
            value={roleFilter}
            open={roleDropdown}
            setOpen={(v) => {
              setRoleDropdown(v);
              if (v) { setStatusDropdown(false); setDateDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Roles" },
              { value: "student", label: "Student" },
              { value: "mentor", label: "Mentor" },
              { value: "admin", label: "Admin" },
            ]}
            onChange={setRoleFilter}
          />

          {/* Filter: Status */}
          <FilterDropdown
            label="Status"
            value={statusFilter}
            open={statusDropdown}
            setOpen={(v) => {
              setStatusDropdown(v);
              if (v) { setRoleDropdown(false); setDateDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "published", label: "Published" },
              { value: "flagged", label: "Flagged" },
              { value: "hidden", label: "Hidden" },
            ]}
            onChange={setStatusFilter}
          />

          {/* Filter: Date */}
          <FilterDropdown
            label="Date"
            value={dateFilter}
            open={dateDropdown}
            setOpen={(v) => {
              setDateDropdown(v);
              if (v) { setRoleDropdown(false); setStatusDropdown(false); }
            }}
            options={[
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ]}
            onChange={setDateFilter}
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_1fr_130px_110px_110px_120px] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={
                filtered.length > 0 &&
                selectedPosts.length === filtered.length
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border dark:border-white/20 accent-purple-600"
            />
          </div>
          <div>Author</div>
          <div>Content</div>
          <div>Engagement</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Table rows */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No posts match your filters.</p>
            </div>
          ) : (
            filtered.map((post) => {
              const st = statusStyles[post.status];
              return (
                <div
                  key={post.id}
                  className="grid grid-cols-[40px_1fr_1fr_130px_110px_110px_120px] gap-4 px-5 py-4 items-center border-b border-border/50 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded border-border dark:border-white/20 accent-purple-600"
                    />
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {post.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                        {post.author}
                        {post.pinned && (
                          <Pin
                            size={12}
                            className="text-amber-500 shrink-0"
                          />
                        )}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadge[post.role]}`}
                      >
                        {post.role}
                      </span>
                    </div>
                  </div>

                  {/* Content Snippet */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  {/* Engagement */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart
                        size={14}
                        className="text-pink-500"
                      />
                      {post.hearts}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={14} className="text-sky-500" />
                      {post.commentCount}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${st.bg} ${st.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                      />
                      {post.status}
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {post.date}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedPostForComments(post)}
                      title="Manage Comments"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
                    >
                      <MessageSquare size={15} />
                    </button>
                    <button
                      onClick={() => handlePin(post.id)}
                      title={post.pinned ? "Unpin" : "Pin"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.pinned
                          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      }`}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Comments Moderation Modal ── */}
      <AnimatePresence>
        {selectedPostForComments && (
          <motion.div
            key="comments-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPostForComments(null)}
          >
            <motion.div
              key="comments-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {selectedPostForComments.avatar}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground dark:text-white truncate">
                      Moderating Comments for{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {selectedPostForComments.author}
                      </span>
                      &apos;s Post
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedPostForComments.comments.length} comment
                      {selectedPostForComments.comments.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPostForComments(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Original Post */}
              <div className="px-6 py-4 border-b border-border dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Original Post
                </p>
                <p className="text-sm text-foreground/80 dark:text-white/70 leading-relaxed">
                  {selectedPostForComments.content}
                </p>
              </div>

              {/* Comments List */}
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {selectedPostForComments.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <MessageSquare
                      size={36}
                      className="mb-3 opacity-20"
                    />
                    <p className="text-sm">No comments on this post.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 dark:divide-white/[0.04]">
                    {selectedPostForComments.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/comment"
                      >
                        <div className="flex items-start gap-3">
                          {/* Commenter Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                            {comment.avatar}
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground dark:text-white">
                                {comment.author}
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} />
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {comment.text}
                            </p>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() =>
                                handleHideComment(
                                  selectedPostForComments.id,
                                  comment.id
                                )
                              }
                              title="Hide Comment"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                            >
                              <EyeOff size={14} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteComment(
                                  selectedPostForComments.id,
                                  comment.id
                                )
                              }
                              title="Delete Comment"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border dark:border-white/[0.06] flex justify-end">
                <button
                  onClick={() => setSelectedPostForComments(null)}
                  className="px-5 py-2 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter Dropdown Component                                          */
/* ------------------------------------------------------------------ */
function FilterDropdown({
  label,
  value,
  open,
  setOpen,
  options,
  onChange,
}: {
  label: string;
  value: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors whitespace-nowrap"
      >
        <Filter size={14} />
        {current?.label ?? label}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === opt.value
                    ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 font-medium"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
