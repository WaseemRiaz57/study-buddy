"use client";

import {
  Award,
  Clock,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

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

interface CommunityStats {
  totalMembers: number;
  activePosts: number;
  activeNow: number;
  postsThisWeek: number;
}

interface CommunitySidebarProps {
  stats: CommunityStats;
  topContributors: Contributor[];
  popularTags: PopularTag[];
  isLoading?: boolean;
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SB"
  );
}

function formatCount(value: number) {
  return Number(value || 0).toLocaleString();
}

function normalizeRole(role: string) {
  const normalized = String(role || "student").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function CommunitySidebar({
  stats,
  topContributors,
  popularTags,
  isLoading = false,
}: CommunitySidebarProps) {
  const quickStats = [
    { label: "Members", value: stats.totalMembers, icon: Users },
    { label: "Posts", value: stats.activePosts, icon: MessageSquare },
    { label: "Active Now", value: stats.activeNow, icon: Clock },
    { label: "This Week", value: stats.postsThisWeek, icon: TrendingUp },
  ];

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-72">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1e1629]">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          <Award size={16} className="text-[#7C3AED]" /> Top Contributors
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading...</p>
          ) : topContributors.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">
              No contributors yet.
            </p>
          ) : (
            topContributors.map((scholar) => (
              <div key={scholar.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                  {scholar.image ? (
                    <img
                      src={scholar.image}
                      alt={scholar.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(scholar.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {scholar.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {normalizeRole(scholar.role)} - {formatCount(scholar.posts)} posts
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1e1629]">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          <TrendingUp size={16} className="text-[#7C3AED]" /> Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading...</p>
          ) : popularTags.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Tags will appear as posts are published.
            </p>
          ) : (
            popularTags.map((item) => (
              <span
                key={item.tag}
                className="cursor-pointer rounded-full bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/20 dark:bg-[#7C3AED]/20"
              >
                #{item.tag}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1e1629]">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          <Sparkles size={16} className="text-[#7C3AED]" /> Community Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-slate-50 p-3 text-center dark:bg-white/5"
            >
              <stat.icon size={16} className="mx-auto mb-1 text-[#7C3AED]" />
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {isLoading ? "..." : formatCount(stat.value)}
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

