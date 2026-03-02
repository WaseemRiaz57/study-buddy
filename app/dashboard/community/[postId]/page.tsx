"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, ThumbsUp, Bookmark, Share2, MessageSquare,
  Send, Clock, Eye, MoreHorizontal, Heart
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const POST = {
  id: "p1",
  title: "Intuitive way to understand eigenvectors?",
  body: `I keep getting lost in the formulas. Does anyone have a geometric/visual way to think about eigenvectors and eigenvalues?

I've been studying linear algebra for a few weeks now, and while I can mechanically solve problems, I don't have a good *intuition* for what's actually happening.

**What I understand so far:**
- A matrix represents a linear transformation
- Eigenvectors are special vectors that don't change direction under the transformation
- Eigenvalues tell you how much they stretch

But when I look at a 3x3 matrix, I can't "see" what the eigenvectors would be. Any visual resources, analogies, or thought experiments that helped you develop intuition?

I've watched 3Blue1Brown's series and it helped somewhat, but I'd love more practice-oriented approaches.`,
  author: "Alex Rivera",
  avatar: "AR",
  role: "Scholar",
  topic: "Math",
  likes: 42,
  views: 310,
  timeAgo: "2 hours ago",
  tags: ["linear-algebra", "eigenvectors", "intuition", "math"],
};

interface Comment {
  id: string;
  author: string;
  avatar: string;
  role: string;
  text: string;
  timeAgo: string;
  likes: number;
  liked: boolean;
}

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "c1",
    author: "Sam Chen",
    avatar: "SC",
    role: "Instructor",
    text: "Great question! Think of it this way: imagine stretching a rubber sheet. Most points move in complicated ways, but some points only move along a straight line from the origin — those are your eigenvectors. The amount of stretch along that line is the eigenvalue.\n\nTry this: pick a 2×2 matrix, draw a bunch of unit vectors, then draw where each one lands after transformation. The ones that stay on their original line are eigenvectors!",
    timeAgo: "1h ago",
    likes: 18,
    liked: false,
  },
  {
    id: "c2",
    author: "Priya Sharma",
    avatar: "PS",
    role: "Tutor",
    text: "I recommend playing with the interactive visualizations on Eigenvectors.io — you can drag vectors around and see the transformation in real time. It was a game-changer for me.",
    timeAgo: "45min ago",
    likes: 12,
    liked: false,
  },
  {
    id: "c3",
    author: "Jordan Lee",
    avatar: "JL",
    role: "Scholar",
    text: "Following this thread! I have the exact same struggle. The rubber sheet analogy from @Sam is really helpful.",
    timeAgo: "30min ago",
    likes: 5,
    liked: false,
  },
  {
    id: "c4",
    author: "Alex Rivera",
    avatar: "AR",
    role: "OP",
    text: "Thanks everyone! The rubber sheet analogy really clicks. Going to try drawing out those vectors tonight. @Priya I'll check out that interactive tool!",
    timeAgo: "15min ago",
    likes: 8,
    liked: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Role badge                                                         */
/* ------------------------------------------------------------------ */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OP: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    Instructor: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    Tutor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    Scholar: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[role] ?? styles.Scholar}`}>
      {role}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function PostDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(POST.likes);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);

  const currentUserName = session?.user?.name || "User";
  const currentUserInitials = currentUserName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const currentUserRole = session?.user?.role
    ? `${session.user.role.charAt(0).toUpperCase()}${session.user.role.slice(1).toLowerCase()}`
    : "Scholar";

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const sendComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: currentUserName,
      avatar: currentUserInitials,
      role: currentUserRole,
      text,
      timeAgo: "Just now",
      likes: 0,
      liked: false,
    };
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const toggleCommentLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f0c13] dark:text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard/community")}
          className="flex items-center gap-2 text-sm font-medium mb-6 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Forum
        </motion.button>

        {/* Post header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8]">{POST.topic}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500"><Clock size={12} /> {POST.timeAgo}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500"><Eye size={12} /> {POST.views} views</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">{POST.title}</h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {POST.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{POST.author}</span>
                <RoleBadge role={POST.role} />
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500">Posted {POST.timeAgo}</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 rounded-2xl border mb-6 prose prose-slate dark:prose-invert max-w-none bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10">
            {POST.body.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.startsWith("**") && line.endsWith("**"))
                return <p key={i} className="font-bold text-slate-900 dark:text-white">{line.replace(/\*\*/g, "")}</p>;
              if (line.startsWith("- "))
                return <li key={i} className="ml-4 text-slate-700 dark:text-gray-300">{line.slice(2)}</li>;
              return <p key={i} className="text-slate-700 dark:text-gray-300">{line}</p>;
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {POST.tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300">#{tag}</span>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-200 dark:border-white/10">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                liked
                  ? "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
              }`}
            >
              <ThumbsUp size={16} className={liked ? "fill-current" : ""} /> {likeCount}
            </button>
            <button
              onClick={() => setSaved((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                saved
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
              }`}
            >
              <Bookmark size={16} className={saved ? "fill-current" : ""} /> {saved ? "Saved" : "Save"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 transition-colors">
              <Share2 size={16} /> Share
            </button>
            <button className="ml-auto p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </motion.div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-6 text-slate-900 dark:text-white">
            <MessageSquare size={20} className="text-purple-600 dark:text-[#8c30e8]" />
            {comments.length} Comments
          </h2>

          <div className="space-y-4">
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl border bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {comment.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{comment.author}</span>
                      <RoleBadge role={comment.role} />
                      <span className="text-xs text-slate-400 dark:text-gray-500">{comment.timeAgo}</span>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                      {comment.text.split("\n").map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleCommentLike(comment.id)}
                      className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        comment.liked
                          ? "text-pink-500"
                          : "text-slate-400 dark:text-gray-500 hover:text-pink-500"
                      }`}
                    >
                      <Heart size={13} className={comment.liked ? "fill-current" : ""} />
                      {comment.likes}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky comment input */}
      <div className="fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl z-40 bg-white/80 border-slate-200 dark:bg-[#0f0c13]/80 dark:border-white/10">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            {currentUserInitials}
          </div>
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendComment(); } }}
            placeholder="Add a comment..."
            className="flex-1 py-3 px-4 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
          />
          <button
            onClick={sendComment}
            disabled={!commentInput.trim()}
            className="p-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
