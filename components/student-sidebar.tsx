"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Video,
  Headphones,
  UserPlus,
  MessageSquare,
  Library,
  Settings,
  LogOut,
  ChevronLeft,
  Sparkles,
  Flame,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Menu data                                                         */
/* ------------------------------------------------------------------ */
interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  {
    icon: FileText,
    label: "Content Generator",
    href: "/dashboard/content-generator",
    badge: "AI",
  },
  { icon: Users, label: "Mentorship", href: "/dashboard/mentorship" },
  { icon: Video, label: "Study Room", href: "/dashboard/study-room" },
  { icon: Headphones, label: "Focus Rooms", href: "/dashboard/focus-rooms" },
  { icon: UserPlus, label: "Study with Buddy", href: "/dashboard/study-buddy" },
  { icon: MessageSquare, label: "Community", href: "/dashboard/community" },
  { icon: Library, label: "Resource Hub", href: "/dashboard/resources" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export function StudentSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative flex flex-col h-screen
        bg-white dark:bg-sidebar-dark
        border-r border-slate-200 dark:border-white/[0.06]
        text-slate-600 dark:text-slate-300
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-72"}
      `}
    >
      {/* ---- Header ---- */}
      <div
        className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-white/[0.06] ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2 overflow-hidden ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Sparkles size={22} className="text-primary dark:text-purple-400 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white whitespace-nowrap">
              StudyBuddy
            </span>
          )}
        </div>

        {/* Collapse / Expand toggle */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`
            p-1.5 rounded-lg
            text-slate-400 hover:text-slate-700 dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-white/10
            transition-colors
            ${isCollapsed ? "absolute -right-3 top-5 bg-white dark:bg-sidebar-dark border border-slate-200 dark:border-white/10 shadow-lg z-10" : ""}
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  group relative flex items-center gap-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${
                    isActive
                      ? "bg-primary/10 dark:bg-purple-500/10 text-primary dark:text-purple-400 shadow-[inset_0_0_20px_rgba(140,48,232,0.06)] dark:shadow-[inset_0_0_20px_rgba(140,48,232,0.08)]"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-800 dark:hover:text-white"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary dark:bg-purple-400" />
                )}

                <item.icon
                  size={20}
                  className={`shrink-0 ${
                    isActive
                      ? "text-primary dark:text-purple-400"
                      : "group-hover:text-primary dark:group-hover:text-purple-400 transition-colors"
                  }`}
                />

                {/* Label (hidden when collapsed) */}
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 dark:bg-purple-500/15 text-primary dark:text-purple-400">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip (collapsed mode only) */}
                {isCollapsed && (
                  <span
                    className="
                      pointer-events-none absolute left-full ml-3
                      whitespace-nowrap rounded-lg
                      bg-white dark:bg-slate-900 px-3 py-1.5
                      text-xs font-medium text-slate-700 dark:text-white
                      shadow-xl border border-slate-200 dark:border-white/10
                      opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                      transition-all duration-200 z-50
                    "
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ---- Liquid Progress Section (hidden when collapsed) ---- */}
      {!isCollapsed && (
        <div className="mx-3 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Daily Streak
              </span>
            </div>
            <span className="text-sm font-bold text-primary dark:text-purple-400">7 days</span>
          </div>

          {/* Liquid progress bar */}
          <div className="relative h-3 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
            {/* Liquid animated fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-400 to-primary dark:from-purple-600 dark:via-purple-400 dark:to-purple-600 animate-liquid"
              style={{ width: "72%" }}
            />
            {/* Shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 dark:from-white/20 to-transparent rounded-full" />
          </div>

          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            72% to your weekly goal
          </p>
        </div>
      )}

      {/* ---- Footer / Logout ---- */}
      <div className="px-3 pb-4 border-t border-slate-200 dark:border-white/[0.06] pt-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`
            group relative flex items-center gap-3 w-full rounded-xl
            text-red-400 hover:bg-red-500/10 hover:text-red-300
            transition-colors
            ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}

          {/* Tooltip for collapsed */}
          {isCollapsed && (
            <span
              className="
                pointer-events-none absolute left-full ml-3
                whitespace-nowrap rounded-lg
                bg-white dark:bg-slate-900 px-3 py-1.5
                text-xs font-medium text-slate-700 dark:text-white
                shadow-xl border border-slate-200 dark:border-white/10
                opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-200 z-50
              "
            >
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
