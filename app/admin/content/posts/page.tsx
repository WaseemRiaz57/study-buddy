"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  ChevronDown,
  Eye,
  Filter,
  Heart,
  Loader2,
  MessageSquare,
  Pin,
  Search,
  Trash2,
} from "lucide-react";

type PostStatus = "Published" | "Flagged";
type Role = "student" | "mentor" | "admin";

interface AdminCommunityPost {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  category: string;
  likesCount: number;
  commentCount: number;
  views: number;
  status: PostStatus;
  isPinned: boolean;
  createdAt: string | null;
  author: {
    id: string;
    name: string;
    image: string;
    initials: string;
    role: Role;
  };
}

const roleBadge: Record<Role, string> = {
  student: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-purple-300",
  admin:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const statusStyles: Record<PostStatus, { dot: string; bg: string; text: string }> = {
  Published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  Flagged: {
    dot: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-500/15",
    text: "text-red-700 dark:text-red-400",
  },
};

function formatDate(input: string | null) {
  if (!input) return "Unknown";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommunityPostsPage() {
  const requestConfirmation = useConfirmDialog();
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(
        `/api/admin/community/posts${params.toString() ? `?${params}` : ""}`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load community posts.");
      }

      setPosts(Array.isArray(data?.posts) ? data.posts : []);
      setSelectedPosts([]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load community posts."
      );
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchPosts();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [fetchPosts]);

  const visiblePostIds = useMemo(() => posts.map((post) => post.id), [posts]);

  const toggleSelect = (id: string) => {
    setSelectedPosts((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPosts((current) =>
      current.length === visiblePostIds.length ? [] : visiblePostIds
    );
  };

  const viewPost = (post: AdminCommunityPost) => {
    window.open(`/dashboard/community/post/${post.id}`, "_blank", "noopener,noreferrer");
  };

  const togglePin = async (post: AdminCommunityPost) => {
    try {
      setBusyPostId(post.id);
      const response = await fetch(
        `/api/admin/community/posts/${post.id}/action`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle-pin" }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update post.");
      }

      toast.success(data?.message || "Post updated.");
      await fetchPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update post.");
    } finally {
      setBusyPostId(null);
    }
  };

  const deletePost = async (post: AdminCommunityPost) => {
    const confirmed = await requestConfirmation({
      title: "Delete post?",
      description: `“${post.title}” and all of its comments will be permanently removed.`,
      confirmLabel: "Delete post",
    });
    if (!confirmed) {
      return;
    }

    try {
      setBusyPostId(post.id);
      const response = await fetch(
        `/api/admin/community/posts/${post.id}/action`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete post.");
      }

      toast.success(data?.message || "Community post deleted.");
      await fetchPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete post.");
    } finally {
      setBusyPostId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedPosts.length) return;
    const confirmed = await requestConfirmation({
      title: `Delete ${selectedPosts.length} posts?`,
      description: "The selected posts and all of their comments will be permanently removed.",
      confirmLabel: "Delete posts",
    });
    if (!confirmed) {
      return;
    }

    try {
      setBusyPostId("bulk");
      const results = await Promise.allSettled(
        selectedPosts.map((postId) =>
          fetch(`/api/admin/community/posts/${postId}/action`, {
            method: "DELETE",
          })
        )
      );
      const failed = results.filter(
        (result) => result.status === "rejected" || !result.value.ok
      ).length;

      if (failed > 0) {
        toast.error(`${failed} selected posts could not be deleted.`);
      } else {
        toast.success("Selected community posts deleted.");
      }

      await fetchPosts();
    } finally {
      setBusyPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
              Community Posts
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-purple-300">
              {posts.length} Posts
            </span>
          </div>

          <AnimatePresence>
            {selectedPosts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => void handleBulkDelete()}
                disabled={busyPostId === "bulk"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyPostId === "bulk" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Bulk Delete ({selectedPosts.length})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search posts by title or content..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
            />
          </div>

          <FilterDropdown
            label="Role"
            value={roleFilter}
            open={roleDropdown}
            setOpen={(open) => {
              setRoleDropdown(open);
              if (open) setStatusDropdown(false);
            }}
            options={[
              { value: "all", label: "All Roles" },
              { value: "student", label: "Student" },
              { value: "mentor", label: "Mentor" },
              { value: "admin", label: "Admin" },
            ]}
            onChange={setRoleFilter}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            open={statusDropdown}
            setOpen={(open) => {
              setStatusDropdown(open);
              if (open) setRoleDropdown(false);
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Published", label: "Published" },
              { value: "Flagged", label: "Flagged" },
            ]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr_150px_110px_120px_120px] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={posts.length > 0 && selectedPosts.length === posts.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border dark:border-white/20 accent-[#7C3AED]"
            />
          </div>
          <div>Author</div>
          <div>Content</div>
          <div>Engagement</div>
          <div>Status</div>
          <div>Date</div>
          <div className="text-right">Actions</div>
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 size={34} className="mb-3 animate-spin text-[#7C3AED]" />
              <p className="text-sm">Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No posts match your filters.</p>
            </div>
          ) : (
            posts.map((post) => {
              const statusStyle = statusStyles[post.status] || statusStyles.Published;
              const isBusy = busyPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="grid grid-cols-[40px_1fr_1fr_150px_110px_120px_120px] gap-4 px-5 py-4 items-center border-b border-border/50 dark:border-white/[0.04] hover:bg-[#7C3AED]/5 transition-colors group"
                >
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 rounded border-border dark:border-white/20 accent-[#7C3AED]"
                    />
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                      {post.author.image ? (
                        <img
                          src={post.author.image}
                          alt={post.author.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        post.author.initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                        {post.author.name}
                        {post.isPinned && (
                          <Pin size={12} className="fill-[#7C3AED] text-[#7C3AED] shrink-0" />
                        )}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          roleBadge[post.author.role] || roleBadge.student
                        }`}
                      >
                        {post.author.role}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {post.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart size={14} className="text-pink-500" />
                      {post.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={14} className="text-sky-500" />
                      {post.commentCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} className="text-[#7C3AED]" />
                      {post.views}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {post.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.createdAt)}
                  </p>

                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => viewPost(post)}
                      title="View Post"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors"
                    >
                      <MessageSquare size={15} />
                    </button>
                    <button
                      onClick={() => void togglePin(post)}
                      disabled={isBusy}
                      title={post.isPinned ? "Unpin" : "Pin"}
                      className={`p-1.5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        post.isPinned
                          ? "text-[#7C3AED] hover:bg-[#7C3AED]/10"
                          : "text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/10"
                      }`}
                    >
                      <Pin
                        size={15}
                        className={post.isPinned ? "fill-[#7C3AED]" : ""}
                      />
                    </button>
                    <button
                      onClick={() => void deletePost(post)}
                      disabled={isBusy}
                      title="Delete"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

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
  setOpen: (value: boolean) => void;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const current = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-[#7C3AED] hover:border-[#7C3AED]/40 transition-colors whitespace-nowrap"
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
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === option.value
                    ? "text-[#7C3AED] bg-[#7C3AED]/10 font-medium"
                    : "text-muted-foreground hover:text-[#7C3AED] hover:bg-[#7C3AED]/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

