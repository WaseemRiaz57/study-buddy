"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbsUp, MessageSquare, Eye, Flame } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface Post {
  id: string;
  title: string;
  excerpt: string;
  body?: string;
  author: {
    id: string;
    name: string;
    image: string;
    initials: string;
    role: string;
  };
  tags: string[];
  category: string;
  attachments: string[];
  role: string;
  likes: number;
  likedByMe: boolean;
  comments: number;
  views: number;
  createdAt: string | null;
  hot: boolean;
}

interface PostCardProps {
  post: Post;
  index?: number;
  onLike?: (postId: string) => void;
  onAuthorClick?: (userId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Role badge (local helper)                                          */
/* ------------------------------------------------------------------ */
function RoleBadge({ role }: { role: string }) {
  const rawRole = String(role || "student").toLowerCase();
  const normalizedRole = rawRole === "mentor" ? "teacher" : rawRole;
  const styles: Record<string, string> = {
    teacher:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    mentor:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    admin:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    student:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        styles[normalizedRole] ?? styles.student
      }`}
    >
      {normalizedRole}
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
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PostCard({
  post,
  index = 0,
  onLike,
  onAuthorClick,
}: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/dashboard/community/${post.id}`}>
        <div className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer bg-white border-slate-200 hover:border-[#7C3AED] dark:bg-[#1e1629] dark:border-white/10 dark:hover:border-[#7C3AED]/70">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAuthorClick?.(post.author.id);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[#7C3AED] text-white overflow-hidden transition-opacity hover:opacity-90"
              aria-label={`View ${post.author.name}'s public profile`}
            >
              {post.author.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                post.author.initials
              )}
            </button>

            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onAuthorClick?.(post.author.id);
                  }}
                  className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#7C3AED] dark:text-white"
                >
                  {post.author.name}
                </button>
                <RoleBadge role={post.author.role || post.role} />
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  {formatRelativeTime(post.createdAt)}
                </span>
                {post.hot && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#7C3AED]">
                    <Flame size={12} /> Hot
                  </span>
                )}
              </div>

              {/* Title & excerpt */}
              <h3 className="font-bold text-lg leading-snug mb-1.5 text-slate-900 dark:text-white">
                {post.title}
              </h3>
              <p className="text-sm line-clamp-2 text-slate-600 dark:text-gray-400">
                {post.excerpt}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-3 text-xs text-slate-500 dark:text-gray-500">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onLike?.(post.id);
                  }}
                  className={`flex items-center gap-1 transition-colors ${
                    post.likedByMe
                      ? "text-[#7C3AED]"
                      : "hover:text-[#7C3AED]"
                  }`}
                >
                  <ThumbsUp size={13} className={post.likedByMe ? "fill-current" : ""} /> {post.likes}
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare size={13} /> {post.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={13} /> {post.views}
                </span>
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20">
                  {post.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

