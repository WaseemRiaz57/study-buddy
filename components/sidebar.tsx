"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  MessageSquare,
  PanelLeftOpen,
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
import { useUserStore, type Plan, type Role } from "@/store/useUserStore";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  roles: Role[];
  badge?: string;
  locked?: boolean;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const buildNavItems = (isCommunity: boolean, plan: string): NavItem[] => [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["STUDENT", "TEACHER", "MENTOR"] },
  { icon: FileText, label: "Notes Generator", href: "/dashboard/content-generator", roles: ["STUDENT"], badge: "AI" },
  { icon: ClipboardList, label: "Quiz Generator", href: "/dashboard/content-generator", roles: ["TEACHER", "MENTOR"], badge: "AI" },
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
  { icon: DollarSign, label: "Earnings", href: "/dashboard/earnings", roles: ["TEACHER", "MENTOR"], locked: isCommunity },
  ...(plan === "FREE" ? [{ icon: Sparkles, label: "Upgrade to Pro", href: "/dashboard/upgrade", roles: ["STUDENT", "TEACHER", "MENTOR"] as Role[], badge: "NEW" }] : []),
  ...(plan === "PRO" ? [{ icon: Sparkles, label: "Upgrade to Elite", href: "/dashboard/upgrade", roles: ["STUDENT", "TEACHER", "MENTOR"] as Role[], badge: "NEW" }] : []),
];

function itemMatches(item: NavItem, href: string) {
  return item.href === href;
}

function groupNavItems(items: NavItem[], isMentorRole: boolean): NavGroup[] {
  const take = (hrefs: string[]) =>
    hrefs
      .map((href) => items.find((item) => itemMatches(item, href)))
      .filter(Boolean) as NavItem[];

  const groups = isMentorRole
    ? [
        {
          category: "MAIN",
          items: take(["/dashboard"]),
        },
        {
          category: "MENTORSHIP CORE",
          items: take(["/dashboard/sessions", "/dashboard/my-students", "/dashboard/earnings"]),
        },
        {
          category: "WORKSPACE",
          items: take([
            "/dashboard/content-generator",
            "/dashboard/resources",
            "/dashboard/study-rooms",
          ]),
        },
        {
          category: "NETWORK",
          items: take(["/dashboard/community"]),
        },
        {
          category: "GAMIFICATION",
          items: take(["/dashboard/leaderboard", "/dashboard/challenges", "/dashboard/badges"]),
        },
      ]
    : [
        {
          category: "MAIN",
          items: take(["/dashboard"]),
        },
        {
          category: "STUDY SPACE",
          items: take([
            "/dashboard/content-generator",
            "/dashboard/focus-rooms",
            "/dashboard/resources",
          ]),
        },
        {
          category: "NETWORK & CONNECT",
          items: take([
            "/dashboard/study-rooms",
            "/dashboard/study-buddy",
            "/dashboard/mentorship",
            "/dashboard/community",
          ]),
        },
        {
          category: "GAMIFICATION",
          items: take(["/dashboard/leaderboard", "/dashboard/challenges", "/dashboard/badges"]),
        },
      ];

  return groups.filter((group) => group.items.length > 0);
}

function getTourClassName(href: string) {
  if (href === "/dashboard/content-generator") return "tour-ai-studio";
  if (href === "/dashboard/focus-rooms") return "tour-focus-rooms";
  if (href === "/dashboard/study-rooms") return "tour-study-rooms";
  if (href === "/dashboard/resources") return "tour-resource-hub";
  if (href === "/dashboard/mentorship") return "tour-mentorship";

  return "";
}

function getGroupId(category: string) {
  return `sidebar-group-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const storeRole = useUserStore((state) => state.role);
  const storePlan = useUserStore((state) => state.plan);
  const role = initialRole || storeRole;
  const plan = initialPlan || storePlan;
  const isMentorRole = role === "TEACHER" || role === "MENTOR";

  const filteredNavItems = buildNavItems(plan === "FREE" || plan === "COMMUNITY", plan).filter((item) => {
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
  const upgradeItem = filteredNavItems.find((item) => item.href === "/dashboard/upgrade");
  const navGroups = groupNavItems(
    filteredNavItems.filter((item) => item.href !== "/dashboard/upgrade"),
    isMentorRole
  );
  const isGroupOpen = (category: string) => openGroups[category] ?? true;
  const toggleGroup = (category: string) => {
    setOpenGroups((current) => ({
      ...current,
      [category]: !(current[category] ?? true),
    }));
  };

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
          <BrandLogo
            size={!mobile && isCollapsed ? "mark" : "lockup"}
            className={mobile || !isCollapsed ? "h-12 w-12" : ""}
          />
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

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, groupIndex) => {
          const groupOpen = isGroupOpen(group.category);
          const groupId = getGroupId(group.category);

          return (
          <div key={group.category} className={groupIndex === 0 ? "" : "mt-6"}>
            {(mobile || !isCollapsed) ? (
              <button
                type="button"
                onClick={() => toggleGroup(group.category)}
                aria-expanded={groupOpen}
                aria-controls={groupId}
                className="mb-2 flex min-h-[36px] w-full items-center justify-between rounded-lg px-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
              >
                <span>{group.category}</span>
                {groupOpen ? (
                  <ChevronDown size={14} aria-hidden="true" />
                ) : (
                  <ChevronRight size={14} aria-hidden="true" />
                )}
              </button>
            ) : (
              <div className="mx-auto mb-2 w-6 border-t border-slate-200 dark:border-white/[0.08]" />
            )}

            {(groupOpen || (!mobile && isCollapsed)) && (
            <div id={groupId} className="space-y-1">
              {group.items.map((item) => {
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
                    aria-label={`${item.label}${item.locked ? " locked" : ""}`}
                  >
                    <div
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl transition-all duration-200 ${
                        getTourClassName(item.href)
                      } ${
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

                      {(mobile || !isCollapsed) && item.locked && (
                        <Lock
                          size={14}
                          className="ml-auto text-muted-foreground/50 dark:text-slate-600"
                        />
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
            </div>
            )}
          </div>
          );
        })}
      </nav>

      {upgradeItem && (
        <div className="border-t border-border px-3 py-4 dark:border-white/[0.06]">
          <Link
            href={upgradeItem.href}
            onClick={() => onNavigate?.()}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl bg-[#7C3AED] text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-purple-700 ${
              !mobile && isCollapsed ? "min-h-[44px] justify-center px-0 py-3" : "min-h-[44px] px-4 py-3"
            }`}
            aria-label={upgradeItem.label}
          >
            <upgradeItem.icon size={20} className="shrink-0" />
            {(mobile || !isCollapsed) && (
              <>
                <span className="whitespace-nowrap text-sm font-bold">
                  {upgradeItem.label}
                </span>
                {upgradeItem.badge && (
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {upgradeItem.badge}
                  </span>
                )}
              </>
            )}
            {!mobile && isCollapsed && (
              <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg border border-border bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900">
                {upgradeItem.label}
              </span>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}

