"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Eye,
  FileText,
  Heart,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";

interface Author {
  id: string;
  name: string;
  image: string;
  initials: string;
  role: string;
}

interface CommunityPostDetail {
  id: string;
  title: string;
  body: string;
  tags: string[];
  category: string;
  attachments: string[];
  author: Author;
  likes: number;
  likedByMe: boolean;
  comments: number;
  views: number;
  createdAt: string | null;
}

interface Comment {
  id: string;
  text: string;
  author: Author;
  likes: number;
  likedByMe: boolean;
  createdAt: string | null;
}

function RoleBadge({ role }: { role: string }) {
  const normalized = String(role || "student").toLowerCase();
  const styles: Record<string, string> = {
    admin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    mentor: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    student: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        styles[normalized] ?? styles.student
      }`}
    >
      {normalized}
    </span>
  );
}

function formatRelativeTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "";

  const minutes = Math.floor((Date.now() - date) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function Avatar({ author, size = "h-10 w-10" }: { author: Author; size?: string }) {
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white`}
    >
      {author.image ? (
        <img
          src={author.image}
          alt={author.name}
          className="h-full w-full object-cover"
        />
      ) : (
        author.initials || getInitials(author.name)
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const postId = String(params?.postId || "");
  const [post, setPost] = useState<CommunityPostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [saved, setSaved] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const currentUserName = session?.user?.name || "User";
  const currentUser: Author = {
    id: session?.user?.id || "",
    name: currentUserName,
    image: session?.user?.image || "",
    initials: getInitials(currentUserName),
    role: session?.user?.role || "student",
  };

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    const response = await fetch(`/api/community/posts/${postId}`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to load post.");
    }

    setPost(data?.post || null);
  }, [postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    const response = await fetch(`/api/community/posts/${postId}/comments`, {
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to load comments.");
    }

    setComments(Array.isArray(data?.comments) ? data.comments : []);
  }, [postId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchPost(), fetchComments()]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load discussion."
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [fetchComments, fetchPost]);

  useEffect(() => {
    if (!postId) return;

    const markViewed = async () => {
      const response = await fetch(`/api/community/posts/${postId}/view`, {
        method: "PATCH",
      });
      const data = await response.json().catch(() => null);

      if (response.ok && typeof data?.views === "number") {
        setPost((current) =>
          current ? { ...current, views: data.views } : current
        );
      }
    };

    void markViewed();
  }, [postId]);

  const toggleLike = async () => {
    if (!post) return;

    const previousPost = post;
    setPost({
      ...post,
      likedByMe: !post.likedByMe,
      likes: post.likedByMe ? Math.max(0, post.likes - 1) : post.likes + 1,
    });

    try {
      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: "PATCH",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update like.");
      }

      setPost((current) =>
        current
          ? {
              ...current,
              likedByMe: Boolean(data?.liked),
              likes: Number(data?.likes || 0),
            }
          : current
      );
    } catch (error) {
      setPost(previousPost);
      toast.error(
        error instanceof Error ? error.message : "Failed to update like."
      );
    }
  };

  const sendComment = async () => {
    const text = commentInput.trim();
    if (!text || !post || isSendingComment) return;

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      text,
      author: currentUser,
      likes: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };

    setCommentInput("");
    setComments((current) => [...current, optimisticComment]);
    setPost((current) =>
      current ? { ...current, comments: current.comments + 1 } : current
    );

    try {
      setIsSendingComment(true);
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to add comment.");
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === optimisticComment.id ? data.comment : comment
        )
      );
      const reward = data?.reward;
      const rewardText = reward
        ? `+${reward.xpAwarded} XP, +${reward.coinsAwarded} coins`
        : "reward added";

      toast.success(`Comment added. ${rewardText}.`);
      window.dispatchEvent(new Event("gamification-stats-updated"));
    } catch (error) {
      setComments((current) =>
        current.filter((comment) => comment.id !== optimisticComment.id)
      );
      setPost((current) =>
        current
          ? { ...current, comments: Math.max(0, current.comments - 1) }
          : current
      );
      setCommentInput(text);
      toast.error(
        error instanceof Error ? error.message : "Failed to add comment."
      );
    } finally {
      setIsSendingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0f0c13]">
        <Loader2 className="animate-spin text-[#7C3AED]" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-[#0f0c13]">
        <div>
          <MessageSquare className="mx-auto mb-3 text-[#7C3AED]" size={34} />
          <p className="font-semibold text-slate-900 dark:text-white">
            Discussion not found
          </p>
          <button
            onClick={() => router.push("/dashboard/community")}
            className="mt-4 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0c13] dark:text-white">
      <div className="mx-auto max-w-4xl p-4 pb-32 md:p-8">
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard/community")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Forum
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
              <Clock size={12} /> {formatRelativeTime(post.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
              <Eye size={12} /> {post.views} views
            </span>
          </div>

          <h1 className="mb-4 text-2xl font-extrabold leading-tight md:text-3xl">
            {post.title}
          </h1>

          <div className="mb-6 flex items-center gap-3">
            <Avatar author={post.author} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {post.author.name}
                </span>
                <RoleBadge role={post.author.role} />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500">
                Posted {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          <article className="prose prose-slate mb-6 max-w-none rounded-2xl border border-slate-200 bg-white p-6 dark:prose-invert dark:border-white/10 dark:bg-[#1e1629]">
            <ReactMarkdown>{post.body}</ReactMarkdown>
          </article>

          {post.attachments.length > 0 && (
            <div className="mb-6 space-y-2">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment}
                  href={attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:bg-[#1e1629] dark:text-gray-300"
                >
                  <FileText size={16} />
                  View attachment
                </a>
              ))}
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 border-b border-slate-200 pb-6 dark:border-white/10">
            <button
              onClick={() => void toggleLike()}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-all ${
                post.likedByMe
                  ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                  : "bg-slate-100 text-slate-600 hover:text-[#7C3AED] dark:bg-white/10 dark:text-gray-300"
              }`}
            >
              <ThumbsUp size={16} className={post.likedByMe ? "fill-current" : ""} /> {post.likes}
            </button>
            <button
              onClick={() => setSaved((value) => !value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-all ${
                saved
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300"
              }`}
            >
              <Bookmark size={16} className={saved ? "fill-current" : ""} />{" "}
              {saved ? "Saved" : "Save"}
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300">
              <Share2 size={16} /> Share
            </button>
            <button className="ml-auto rounded-xl p-2.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-gray-500 dark:hover:text-white">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </motion.div>

        <div className="mt-8">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <MessageSquare size={20} className="text-[#7C3AED]" />
            {comments.length} Comments
          </h2>

          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1e1629]"
              >
                <div className="flex items-start gap-3">
                  <Avatar author={comment.author} size="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {comment.author.name}
                      </span>
                      <RoleBadge role={comment.author.role} />
                      <span className="text-xs text-slate-400 dark:text-gray-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                      {comment.text}
                    </div>
                    <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-[#7C3AED] dark:text-gray-500">
                      <Heart size={13} />
                      {comment.likes}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f0c13]/85">
        <div className="mx-auto flex max-w-4xl items-center gap-3 p-4">
          <Avatar author={currentUser} size="h-8 w-8" />
          <input
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void sendComment();
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none placeholder-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
          />
          <button
            onClick={() => void sendComment()}
            disabled={!commentInput.trim() || isSendingComment}
            className="rounded-xl bg-[#7C3AED] p-3 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSendingComment ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
