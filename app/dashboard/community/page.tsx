"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Filter, Loader2, MessageSquare, Plus, Search } from "lucide-react";
import CreatePostModal from "@/components/community/CreatePostModal";
import PostCard, { type Post } from "@/components/community/PostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import PublicProfileModal from "@/components/PublicProfileModal";

const TOPIC_FILTERS = [
  "All",
  "Math",
  "Physics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Literature",
  "History",
  "Philosophy",
];

const EMPTY_STATS = {
  totalMembers: 0,
  activePosts: 0,
  activeNow: 0,
  postsThisWeek: 0,
};

interface CreatePostPayload {
  title: string;
  body: string;
  category: string;
  tags: string[];
  files: File[];
}

interface Contributor {
  id: string;
  name: string;
  image: string;
  role: string;
  posts: number;
}

interface PopularTag {
  tag: string;
  count: number;
}

async function uploadCommunityAttachments(files: File[]) {
  const urls: string[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/vault/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Failed to upload ${file.name}.`);
    }

    if (data?.secure_url) {
      urls.push(String(data.secure_url));
    }
  }

  return urls;
}

export default function CommunityFeedPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
  const [sortMode, setSortMode] = useState<"Recent" | "Hot">("Recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicProfileUserId, setPublicProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      const params = new URLSearchParams();
      params.set("sort", sortMode);

      if (activeTopic !== "All") {
        params.set("category", activeTopic);
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const response = await fetch(`/api/community/posts?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load discussions.");
      }

      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load discussions."
      );
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [activeTopic, debouncedSearch, sortMode]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch("/api/community/stats", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load community stats.");
      }

      setStats({ ...EMPTY_STATS, ...(data?.stats || {}) });
      setTopContributors(
        Array.isArray(data?.topContributors) ? data.topContributors : []
      );
      setPopularTags(Array.isArray(data?.popularTags) ? data.popularTags : []);
    } catch {
      setStats(EMPTY_STATS);
      setTopContributors([]);
      setPopularTags([]);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const publishPost = async (payload: CreatePostPayload) => {
    try {
      setIsPublishing(true);
      const attachments = await uploadCommunityAttachments(payload.files);
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          body: payload.body,
          category: payload.category,
          tags: payload.tags,
          attachments,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to publish post.");
      }

      const reward = data?.reward;
      const rewardText = reward
        ? `+${reward.xpAwarded} XP, +${reward.coinsAwarded} coins`
        : "reward added";

      toast.success(`Post published. ${rewardText}.`);
      window.dispatchEvent(new Event("gamification-stats-updated"));
      setModalOpen(false);
      await Promise.all([fetchPosts(), fetchStats()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish post."
      );
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleLike = async (postId: string) => {
    const previousPosts = posts;

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: !post.likedByMe,
              likes: post.likedByMe ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post
      )
    );

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "PATCH",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update like.");
      }

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likedByMe: Boolean(data?.liked), likes: Number(data?.likes || 0) }
            : post
        )
      );
    } catch (error) {
      setPosts(previousPosts);
      toast.error(
        error instanceof Error ? error.message : "Failed to update like."
      );
    }
  };

  const totalActivePosts = useMemo(() => stats.activePosts, [stats.activePosts]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-[#0f0c13] dark:text-white md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#7C3AED]">
            <BookOpen size={16} /> Community Forum
          </div>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            The Scholar&apos;s Agora
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            Ask questions, share insights, and learn together.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/25 transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          <span>New Post</span>
        </button>
      </motion.div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search discussions..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none placeholder-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <button
              onClick={() =>
                setSortMode((current) => (current === "Recent" ? "Hot" : "Recent"))
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <Filter size={16} /> {sortMode}
            </button>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {TOPIC_FILTERS.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTopic === topic
                    ? "bg-[#7C3AED] text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            {isLoadingPosts ? "Loading discussions" : `${totalActivePosts.toLocaleString()} active posts`}
          </div>

          <div className="space-y-4">
            {isLoadingPosts ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#7C3AED]" size={30} />
              </div>
            ) : posts.length > 0 ? (
              posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  onLike={toggleLike}
                  onAuthorClick={setPublicProfileUserId}
                />
              ))
            ) : (
              <div className="py-16 text-center text-slate-500 dark:text-gray-400">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No discussions found</p>
                <p className="mt-1 text-sm">
                  Try a different search or topic filter.
                </p>
              </div>
            )}
          </div>
        </div>

        <CommunitySidebar
          stats={stats}
          topContributors={topContributors}
          popularTags={popularTags}
          isLoading={isLoadingStats}
        />
      </div>

      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPublish={publishPost}
        categories={TOPIC_FILTERS}
        isPublishing={isPublishing}
      />
      <PublicProfileModal
        userId={publicProfileUserId}
        onClose={() => setPublicProfileUserId(null)}
      />
    </div>
  );
}

