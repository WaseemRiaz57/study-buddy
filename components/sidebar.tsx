"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Library,
  Lock,
  MessageSquare,
  PanelLeftOpen,
  Send,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useSidebarBadges } from "@/store/useSidebarBadges";
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
  { icon: FileText, label: "AI Studio", href: "/dashboard/content-generator", roles: ["STUDENT"], badge: "AI" },
  { icon: ClipboardList, label: "AI Studio", href: "/dashboard/content-generator", roles: ["TEACHER", "MENTOR"], badge: "AI" },
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
  mobile = false,
  onNavigate,
  onClose,
}: {
  initialRole?: Role;
  initialPlan?: Plan;
  mobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const unreadMessagesCount = useSidebarBadges((state) => state.counts.messages);
  const setBadge = useSidebarBadges((state) => state.setBadge);
  const clearBadge = useSidebarBadges((state) => state.clearBadge);
  const storeRole = useUserStore((state) => state.role);
  const storePlan = useUserStore((state) => state.plan);
  const role = initialRole || storeRole;
  const plan = initialPlan || storePlan;
  const isMentorRole = role === "TEACHER" || role === "MENTOR";

  const navItems = buildNavItems(plan === "FREE" || plan === "COMMUNITY").filter((item) => {
    if (!item.roles.includes(role)) return false;

    if (
      isMentorRole &&
      (item.href === "/dashboard/focus-rooms" ||
        item.href === "/dashboard/study-buddy")
    ) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/unread-count", {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null);

        if (!cancelled && response.ok) {
          setBadge("messages", Number(data?.unreadConversations || 0));
        }
      } catch {
        if (!cancelled) {
          setBadge("messages", 0);
        }
      }
    };

    void fetchUnreadCount();
    window.addEventListener("messages:unread-updated", fetchUnreadCount);

    return () => {
      cancelled = true;
      window.removeEventListener("messages:unread-updated", fetchUnreadCount);
    };
  }, [setBadge]);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/messages")) {
      clearBadge("messages");
    }
  }, [clearBadge, pathname]);

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-border bg-background text-muted-foreground transition-all duration-300 ease-in-out dark:border-white/[0.06] dark:bg-[#0a0a0f] dark:text-slate-300 ${
        mobile ? "w-72 max-w-[86vw]" : isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className={`flex h-20 items-center border-b border-border px-4 dark:border-white/[0.06] ${
          mobile || !isCollapsed ? "justify-between" : "justify-center"
        }`}
      >
        <Link
          href={!mobile && isCollapsed ? "#" : "/dashboard"}
          onClick={(event) => {
            if (!mobile && isCollapsed) {
              event.preventDefault();
              setIsCollapsed(false);
              return;
            }

            onNavigate?.();
          }}
          className={`flex min-w-0 items-center gap-0.5 ${
            !mobile && isCollapsed ? "justify-center" : ""
          }`}
          aria-label={!mobile && isCollapsed ? "Expand sidebar" : "Dashboard"}
        >
          <BrandLogo size={!mobile && isCollapsed ? "mark" : "lockup"} />
          {(mobile || !isCollapsed) && (
            <span className="whitespace-nowrap text-[28px] font-extrabold leading-none tracking-tight text-[#7C3AED]">
              StudyBuddy
            </span>
          )}
        </Link>

        {mobile ? (
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        ) : !isCollapsed ? (
          <button
            onClick={() => setIsCollapsed((current) => !current)}
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeftOpen
              size={18}
              className="text-[#7C3AED] transition-transform duration-300"
            />
          </button>
        ) : (
          null
        )}
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.locked ? "#" : item.href}
              onClick={(event) => {
                if (item.locked) {
                  event.preventDefault();
                  return;
                }

                onNavigate?.();
              }}
              aria-disabled={item.locked}
            >
              <div
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl transition-all duration-200 ${
                  !mobile && isCollapsed ? "min-h-[44px] justify-center px-0 py-3" : "min-h-[44px] px-4 py-3"
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

                {(mobile || !isCollapsed) && (
                  <span className="whitespace-nowrap text-sm font-medium">
                    {item.label}
                  </span>
                )}

                {(mobile || !isCollapsed) && item.badge && (
                  <span className="ml-auto rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] dark:bg-[#7C3AED]/15">
                    {item.badge}
                  </span>
                )}

                {(mobile || !isCollapsed) &&
                  item.href === "/dashboard/messages" &&
                  unreadMessagesCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </span>
                  )}

                {(mobile || !isCollapsed) && item.locked && (
                  <Lock
                    size={14}
                    className="ml-auto text-muted-foreground/50 dark:text-slate-600"
                  />
                )}

                {!mobile &&
                  isCollapsed &&
                  item.href === "/dashboard/messages" &&
                  unreadMessagesCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                  )}

                {!mobile && isCollapsed && (
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

