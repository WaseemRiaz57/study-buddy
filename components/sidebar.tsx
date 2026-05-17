"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Library,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useUserStore, type Plan, type Role } from "@/store/useUserStore";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles: Role[];
  badge?: string;
  locked?: boolean;
}

const buildNavItems = (isCommunity: boolean): NavItem[] => [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: FileText, label: "AI Generator", href: "/dashboard/content-generator", roles: ["STUDENT"], badge: "AI" },
  { icon: ClipboardList, label: "Quiz Generator", href: "/dashboard/content-generator", roles: ["TEACHER", "MENTOR"] },
  { icon: Library, label: "Resource Hub", href: "/dashboard/resources", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Users, label: "My Students", href: "/dashboard/my-students", roles: ["TEACHER", "MENTOR"] },
  { icon: CalendarCheck, label: "Sessions", href: "/dashboard/sessions", roles: ["TEACHER", "MENTOR"] },
  { icon: UserPlus, label: "Study with Buddy", href: "/dashboard/study-buddy", roles: ["STUDENT"] },
  { icon: GraduationCap, label: "Mentorship", href: "/dashboard/mentorship", roles: ["STUDENT"] },
  { icon: Video, label: "Study Rooms", href: "/dashboard/study-rooms", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Headphones, label: "Focus Rooms", href: "/dashboard/focus-rooms", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Swords, label: "Challenges", href: "/dashboard/challenges", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Award, label: "Badges", href: "/dashboard/badges", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: MessageSquare, label: "Community", href: "/dashboard/community", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: Send, label: "Messages", href: "/dashboard/messages", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: DollarSign, label: "Earnings", href: "/dashboard/earnings", roles: ["TEACHER", "MENTOR"], locked: isCommunity },
  { icon: Sparkles, label: "Upgrade to Pro", href: "/dashboard/upgrade", roles: ["STUDENT", "TEACHER", "MENTOR"], badge: "NEW" },
];

export function Sidebar({
  initialRole,
  initialPlan,
}: {
  initialRole?: Role;
  initialPlan?: Plan;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const storeRole = useUserStore((state) => state.role);
  const storePlan = useUserStore((state) => state.plan);
  const role = initialRole || storeRole;
  const plan = initialPlan || storePlan;
  const isTeacher = role === "TEACHER" || role === "MENTOR";

  const navItems = buildNavItems(plan === "FREE" || plan === "COMMUNITY").filter((item) => {
    if (!item.roles.includes(role)) return false;

    if (
      isTeacher &&
      (item.href === "/dashboard/focus-rooms" ||
        item.href === "/dashboard/study-buddy")
    ) {
      return false;
    }

    return true;
  });

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-border bg-background text-muted-foreground transition-all duration-300 ease-in-out dark:border-white/[0.06] dark:bg-[#0a0a0f] dark:text-slate-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className={`flex h-16 items-center border-b border-border px-4 dark:border-white/[0.06] ${
          isCollapsed ? "justify-center" : "justify-end"
        }`}
      >
        <button
          onClick={() => setIsCollapsed((current) => !current)}
          className={`rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white ${
            isCollapsed
              ? "absolute -right-3 top-5 z-10 border border-border bg-background shadow-lg dark:border-white/10 dark:bg-[#0a0a0f]"
              : ""
          }`}
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

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.locked ? "#" : item.href}
              onClick={(event) => item.locked && event.preventDefault()}
              aria-disabled={item.locked}
            >
              <div
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"
                } ${
                  isActive
                    ? "bg-[#7C3AED]/10 text-[#7C3AED] dark:text-purple-400 dark:shadow-[inset_0_0_20px_rgba(140,48,232,0.08)]"
                    : item.locked
                      ? "cursor-not-allowed text-muted-foreground/50 dark:text-slate-600"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#7C3AED]" />
                )}

                <item.icon
                  size={20}
                  className={`shrink-0 ${
                    isActive
                      ? "text-[#7C3AED] dark:text-purple-400"
                      : item.locked
                        ? "text-muted-foreground/50 dark:text-slate-600"
                        : "transition-colors group-hover:text-[#7C3AED]"
                  }`}
                />

                {!isCollapsed && (
                  <span className="whitespace-nowrap text-sm font-medium">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] dark:bg-[#7C3AED]/15">
                    {item.badge}
                  </span>
                )}

                {!isCollapsed && item.locked && (
                  <Lock
                    size={14}
                    className="ml-auto text-muted-foreground/50 dark:text-slate-600"
                  />
                )}

                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg border border-border bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900">
                    {item.label}
                    {item.locked && " Locked"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

