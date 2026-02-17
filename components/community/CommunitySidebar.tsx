"use client";

import {
  TrendingUp, MessageSquare, Clock, Sparkles, Users, Award,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const TRENDING_SCHOLARS = [
  { name: "Sam Chen", role: "Instructor", avatar: "SC", posts: 47 },
  { name: "Priya Sharma", role: "Tutor", avatar: "PS", posts: 32 },
  { name: "Alex Rivera", role: "Scholar", avatar: "AR", posts: 28 },
];

const POPULAR_TAGS = [
  "#calculus",
  "#machine-learning",
  "#study-tips",
  "#organic-chem",
  "#quantum",
  "#algorithms",
  "#essay-writing",
  "#genetics",
];

const QUICK_STATS = [
  { label: "Members", value: "1,247", icon: Users },
  { label: "Posts", value: "3,891", icon: MessageSquare },
  { label: "Active Now", value: "86", icon: Clock },
  { label: "This Week", value: "+142", icon: TrendingUp },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CommunitySidebar() {
  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* ---- Top Contributors ---- */}
      <div className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-slate-900 dark:text-white">
          <Award size={16} className="text-purple-600 dark:text-[#8c30e8]" />{" "}
          Top Contributors
        </h3>
        <div className="space-y-3">
          {TRENDING_SCHOLARS.map((scholar) => (
            <div key={scholar.name} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {scholar.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                  {scholar.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {scholar.role} · {scholar.posts} posts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Popular Tags ---- */}
      <div className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-slate-900 dark:text-white">
          <TrendingUp size={16} className="text-purple-600 dark:text-[#8c30e8]" />{" "}
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ---- Community Stats ---- */}
      <div className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-slate-900 dark:text-white">
          <Sparkles size={16} className="text-purple-600 dark:text-[#8c30e8]" />{" "}
          Community Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-slate-50 dark:bg-white/5"
            >
              <stat.icon
                size={16}
                className="mx-auto mb-1 text-purple-600 dark:text-[#8c30e8]"
              />
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
