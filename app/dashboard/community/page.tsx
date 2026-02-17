"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, MessageSquare, Filter, Plus, BookOpen,
} from "lucide-react";
import CreatePostModal from "@/components/community/CreatePostModal";
import PostCard from "@/components/community/PostCard";
import type { Post } from "@/components/community/PostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const TOPIC_FILTERS = [
  "All", "Math", "Physics", "Computer Science", "Biology", "Chemistry",
  "Literature", "History", "Philosophy",
];

const POSTS: Post[] = [
  {
    id: "p1",
    title: "Intuitive way to understand eigenvectors?",
    excerpt:
      "I keep getting lost in the formulas. Does anyone have a geometric/visual way to think about eigenvectors and eigenvalues?",
    author: "Alex Rivera",
    avatar: "AR",
    role: "Scholar",
    topic: "Math",
    likes: 42,
    comments: 18,
    views: 310,
    timeAgo: "2h ago",
    hot: true,
  },
  {
    id: "p2",
    title: "Best resources for learning Rust in 2025",
    excerpt:
      "I want to go beyond the Rust book. Any project-based or video resources that helped you?",
    author: "Priya Sharma",
    avatar: "PS",
    role: "Tutor",
    topic: "Computer Science",
    likes: 35,
    comments: 24,
    views: 520,
    timeAgo: "5h ago",
    hot: true,
  },
  {
    id: "p3",
    title: "How does CRISPR gene editing actually work?",
    excerpt:
      "Looking for a clear, jargon-free explanation of the Cas9 mechanism and guide RNA targeting.",
    author: "Jordan Lee",
    avatar: "JL",
    role: "Scholar",
    topic: "Biology",
    likes: 28,
    comments: 12,
    views: 190,
    timeAgo: "8h ago",
    hot: false,
  },
  {
    id: "p4",
    title: "Thermodynamics: entropy explained simply",
    excerpt:
      "I wrote a short guide comparing entropy to shuffling a deck of cards. Feedback welcome!",
    author: "Sam Chen",
    avatar: "SC",
    role: "Instructor",
    topic: "Physics",
    likes: 56,
    comments: 31,
    views: 740,
    timeAgo: "1d ago",
    hot: true,
  },
  {
    id: "p5",
    title: "Favorite philosophy thought experiments?",
    excerpt:
      "The trolley problem gets all the attention. What are some lesser-known ones that made you think?",
    author: "Mia Torres",
    avatar: "MT",
    role: "Scholar",
    topic: "Philosophy",
    likes: 19,
    comments: 27,
    views: 205,
    timeAgo: "1d ago",
    hot: false,
  },
  {
    id: "p6",
    title: "Organic chemistry: memorization vs understanding",
    excerpt:
      "How do you balance rote memorization of reactions with actually understanding mechanisms?",
    author: "Devon Park",
    avatar: "DP",
    role: "Scholar",
    topic: "Chemistry",
    likes: 22,
    comments: 15,
    views: 180,
    timeAgo: "2d ago",
    hot: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CommunityFeedPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = POSTS.filter((p) => {
    const matchTopic = activeTopic === "All" || p.topic === activeTopic;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-900 dark:bg-[#0f0c13] dark:text-white">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-[#8c30e8] mb-1">
            <BookOpen size={16} /> Community Forum
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">The Scholar&apos;s Agora</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-400">Ask questions, share insights, and learn together.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="group relative flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow">
          <Plus size={18} />
          <span className="relative z-10">New Post</span>
          <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md translate-x-0 group-hover:translate-x-[340%] transition-transform duration-700" />
        </button>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border font-medium bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10 transition-colors">
              <Filter size={16} /> Filters
            </button>
          </div>

          {/* Topic pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {TOPIC_FILTERS.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTopic === topic
                    ? "bg-purple-600 text-white dark:bg-[#8c30e8]"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Post list */}
          <div className="space-y-4">
            {filtered.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500 dark:text-gray-400">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No discussions found</p>
                <p className="text-sm mt-1">Try a different search or topic filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <CommunitySidebar />
      </div>

      <CreatePostModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
