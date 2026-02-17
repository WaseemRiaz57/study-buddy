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
  author: string;
  avatar: string;
  role: string;
  topic: string;
  likes: number;
  comments: number;
  views: number;
  timeAgo: string;
  hot: boolean;
}

interface PostCardProps {
  post: Post;
  index?: number;
}

/* ------------------------------------------------------------------ */
/*  Role badge (local helper)                                          */
/* ------------------------------------------------------------------ */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Instructor:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    Tutor:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    Scholar:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        styles[role] ?? styles.Scholar
      }`}
    >
      {role}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/dashboard/community/${post.id}`}>
        <div className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer bg-white border-slate-200 hover:border-purple-300 dark:bg-[#1e1629] dark:border-white/10 dark:hover:border-[#8c30e8]/40">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {post.avatar}
            </div>

            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {post.author}
                </span>
                <RoleBadge role={post.role} />
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  {post.timeAgo}
                </span>
                {post.hot && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
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
                <span className="flex items-center gap-1">
                  <ThumbsUp size={13} /> {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={13} /> {post.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={13} /> {post.views}
                </span>
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300">
                  {post.topic}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
