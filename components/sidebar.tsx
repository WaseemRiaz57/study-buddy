"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Award,
  Headphones,
  Video,
  FileText,
  Library,
  UserPlus,
  Users,
  ClipboardList,
  CalendarCheck,
  Inbox,
  Clock,
  MessageSquare, 
  GraduationCap, 
  DollarSign,
  Lock,
  LogOut,
  ChevronLeft,
  Sparkles,
  Flame,
  Settings,
  Send, // <--- Ye raha Send
  type LucideIcon,
} from "lucide-react";
import { useUserStore, type Role } from "@/store/useUserStore";

/* ------------------------------------------------------------------ */
/* Nav item definition                                               */
/* ------------------------------------------------------------------ */
interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles: Role[];
  badge?: string;
  locked?: boolean;
}

/* ------------------------------------------------------------------ */
/* Navigation data (Settings removed from here)                      */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Navigation data                                                   */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Navigation data (Decluttered & Logically Ordered)                 */
/* ------------------------------------------------------------------ */
const buildNavItems = (isCommunity: boolean): NavItem[] => [
  // ── 1. Core ──
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard",                    roles: ["STUDENT", "MENTOR"] },
  
  // ── 2. Tools & Resources ──
  { icon: FileText,        label: "AI Generator",   href: "/dashboard/content-generator", roles: ["STUDENT"], badge: "AI" },
  { icon: ClipboardList,   label: "Quiz Generator", href: "/dashboard/content-generator", roles: ["MENTOR"] },
  { icon: Library,         label: "Resource Hub",   href: "/dashboard/resources",         roles: ["STUDENT", "MENTOR"] },
  
  // ── 3. Workspace (Management & Peers) ──
  { icon: Users,           label: "My Students",    href: "/dashboard/my-students",       roles: ["MENTOR"] },
  { icon: CalendarCheck,   label: "Sessions",       href: "/dashboard/sessions",          roles: ["MENTOR"] }, // Availability shifted inside this page
  { icon: UserPlus,        label: "Study with Buddy",href: "/dashboard/study-buddy",       roles: ["STUDENT"] },
  { icon: GraduationCap,   label: "Mentorship",     href: "/dashboard/mentorship",         roles: ["STUDENT"] },
  
  // ── 4. Study Environments ──
  { icon: Video,           label: "Study Rooms",    href: "/dashboard/study-rooms",        roles: ["STUDENT", "MENTOR"] },
  { icon: Headphones,      label: "Focus Rooms",    href: "/dashboard/focus-rooms",        roles: ["STUDENT", "MENTOR"] },
  
  // ── 5. Gamification & Community ──
  { icon: Trophy,          label: "Leaderboard",    href: "/dashboard/leaderboard",        roles: ["STUDENT", "MENTOR"] },
  { icon: Swords,          label: "Challenges",     href: "/dashboard/challenges",         roles: ["STUDENT", "MENTOR"] },
  { icon: Award,           label: "Badges",         href: "/dashboard/badges",             roles: ["STUDENT", "MENTOR"] },
  { icon: MessageSquare,   label: "Community",      href: "/dashboard/community",          roles: ["STUDENT", "MENTOR"] },
  { icon: Send,            label: "Messages",       href: "/dashboard/messages",           roles: ["STUDENT", "MENTOR"] },
 // ── 6. Business & Upgrades ──
{ icon: DollarSign,      label: "Earnings",       href: "/dashboard/earnings",           roles: ["MENTOR"], locked: isCommunity },
{ icon: Sparkles,        label: "Upgrade to Pro", href: "/dashboard/upgrade",            roles: ["STUDENT", "MENTOR"], badge: "NEW" },
];
/* ------------------------------------------------------------------ */
/* Sidebar component                                                 */
/* ------------------------------------------------------------------ */
export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = useUserStore((s) => s.role);
  const plan = useUserStore((s) => s.plan);

  const navItems = buildNavItems(plan === "COMMUNITY").filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside
      className={`
        relative flex flex-col h-screen
        bg-background dark:bg-[#0a0a0f] border-r border-border dark:border-white/[0.06]
        text-muted-foreground dark:text-slate-300 transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-72"}
      `}
    >
      {/* ── Header ── */}
      <div
        className={`flex items-center h-16 px-4 border-b border-border dark:border-white/[0.06] ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
          <Sparkles size={22} className="text-purple-600 dark:text-purple-400 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">
              StudyBuddy
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`
            p-1.5 rounded-lg text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-white/10 transition-colors
            ${isCollapsed ? "absolute -right-3 top-5 bg-background dark:bg-[#0a0a0f] border border-border dark:border-white/10 shadow-lg z-10" : ""}
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.locked ? "#" : item.href}
              onClick={(e) => item.locked && e.preventDefault()}
              aria-disabled={item.locked}
            >
              <div
                className={`
                  group relative flex items-center gap-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${
                    isActive
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:shadow-[inset_0_0_20px_rgba(140,48,232,0.08)]"
                      : item.locked
                        ? "text-muted-foreground/50 dark:text-slate-600 cursor-not-allowed"
                        : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-purple-600 dark:bg-purple-400" />
                )}

                <item.icon
                  size={20}
                  className={`shrink-0 ${
                    isActive
                      ? "text-purple-600 dark:text-purple-400"
                      : item.locked
                        ? "text-muted-foreground/50 dark:text-slate-600"
                        : "group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  }`}
                />

                {/* Label */}
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    {item.badge}
                  </span>
                )}

                {/* Lock icon for gated features */}
                {!isCollapsed && item.locked && (
                  <Lock size={14} className="ml-auto text-muted-foreground/50 dark:text-slate-600" />
                )}

                {/* Tooltip (collapsed) */}
                {isCollapsed && (
                  <span
                    className="
                      pointer-events-none absolute left-full ml-3
                      whitespace-nowrap rounded-lg
                      bg-slate-800 dark:bg-slate-900 px-3 py-1.5
                      text-xs font-medium text-white
                      shadow-xl border border-border dark:border-white/10
                      opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                      transition-all duration-200 z-50
                    "
                  >
                    {item.label}
                    {item.locked && " 🔒"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Streak widget (expanded only) ── */}
      {!isCollapsed && (
        <div className="mx-3 mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-border dark:border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-500 dark:text-orange-400" />
              <span className="text-xs font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wider">
                Daily Streak
              </span>
            </div>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">7 days</span>
          </div>

          <div className="relative h-3 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 dark:from-purple-600 dark:via-purple-400 dark:to-purple-600 animate-liquid"
              style={{ width: "72%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground dark:text-slate-500">72% to your weekly goal</p>
        </div>
      )}

      {/* ── Bottom Actions (Settings & Logout) ── */}
      <div className="px-3 pb-4 border-t border-border dark:border-white/[0.06] pt-3 space-y-1">
        
        {/* Settings Button */}
        <Link href="/dashboard/settings">
          <div
            className={`
              group relative flex items-center gap-3 w-full rounded-xl
              text-muted-foreground dark:text-slate-400 
              hover:bg-slate-100 dark:hover:bg-white/[0.04] 
              hover:text-slate-900 dark:hover:text-white
              transition-colors
              ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
              ${pathname === "/dashboard/settings" ? "bg-slate-100 dark:bg-white/[0.04] text-slate-900 dark:text-white" : ""}
            `}
          >
            <Settings size={20} className="shrink-0 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}

            {isCollapsed && (
              <span
                className="
                  pointer-events-none absolute left-full ml-3
                  whitespace-nowrap rounded-lg
                  bg-slate-800 dark:bg-slate-900 px-3 py-1.5
                  text-xs font-medium text-white
                  shadow-xl border border-border dark:border-white/10
                  opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-200 z-50
                "
              >
                Settings
              </span>
            )}
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`
            group relative flex items-center gap-3 w-full rounded-xl
            text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300
            transition-colors
            ${isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}

          {isCollapsed && (
            <span
              className="
                pointer-events-none absolute left-full ml-3
                whitespace-nowrap rounded-lg
                bg-slate-800 dark:bg-slate-900 px-3 py-1.5
                text-xs font-medium text-white
                shadow-xl border border-border dark:border-white/10
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