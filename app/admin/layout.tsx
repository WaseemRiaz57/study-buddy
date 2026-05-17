"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  Library,
  Bot,
  Pin,
  Flag,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Users,
  GraduationCap,
  Trophy,
  Swords,
  CreditCard,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  LogOut,
  Sparkles,
  Search,
  Star,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ------------------------------------------------------------------ */
/* Navigation groups                                                  */
/* ------------------------------------------------------------------ */
const navGroups: NavGroup[] = [
  {
    title: "Core / Analytics",
    items: [
      { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    ],
  },
  {
    title: "Content Management",
    items: [
      { icon: MessageSquare, label: "Community Posts", href: "/admin/content/posts" },
      { icon: Library, label: "Resources Library", href: "/admin/content/resources", badge: "12", badgeColor: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" },
      { icon: Bot, label: "AI Content Review", href: "/admin/content/ai-review" },
      { icon: Pin, label: "Featured Content", href: "/admin/content/featured" },
      { icon: Star, label: "Platform Reviews", href: "/admin/reviews" },
    ],
  },
  {
    title: "Reports & Moderation",
    items: [
      { icon: Flag, label: "Reports Queue", href: "/admin/moderation/reports", badge: "5", badgeColor: "bg-red-500 text-white" },
      { icon: AlertTriangle, label: "Strikes & Warnings", href: "/admin/moderation/strikes" },
      { icon: Scale, label: "Appeals", href: "/admin/moderation/appeals" },
      { icon: ShieldCheck, label: "Auto-Mod Settings", href: "/admin/moderation/settings" },
    ],
  },
  {
    title: "Users & Teachers",
    items: [
      { icon: Users, label: "User Management", href: "/admin/users" },
      { icon: GraduationCap, label: "Mentor Management", href: "/admin/mentors", badge: "3", badgeColor: "bg-orange-500 text-white" },
    ],
  },
  {
    title: "Gamification",
    items: [
      { icon: Trophy, label: "Leaderboard Control", href: "/admin/leaderboard" },
      { icon: Swords, label: "Challenges Mgmt", href: "/admin/challenges" },
    ],
  },
  {
    title: "Business & System",
    items: [
      { icon: CreditCard, label: "Monetization & Plans", href: "/admin/monetization" },
      { icon: Megaphone, label: "Notifications", href: "/admin/notifications" },
      { icon: Settings, label: "Platform Settings", href: "/admin/settings" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function checkActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/* Sidebar Nav Link                                                   */
/* ------------------------------------------------------------------ */
function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={item.href} onClick={onNavigate}>
      <div
        className={`
          group relative flex items-center gap-3 rounded-xl
          transition-all duration-200 overflow-hidden
          ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
          ${
            active
              ? "bg-primary/10 text-primary border-l-4 border-primary"
              : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent"
          }
        `}
      >
        <item.icon
          size={19}
          className={`shrink-0 ${
            active
              ? "text-primary"
              : "group-hover:text-primary transition-colors"
          }`}
        />

        {!collapsed && (
          <span className="text-[13px] font-medium whitespace-nowrap truncate">
            {item.label}
          </span>
        )}

        {/* Expanded badge */}
        {!collapsed && item.badge && (
          <span
            className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              item.badgeColor || "bg-purple-500/10 text-purple-600 dark:text-purple-400"
            }`}
          >
            {item.badge}
          </span>
        )}

        {/* Collapsed badge dot */}
        {collapsed && item.badge && (
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
              item.badgeColor?.includes("red") ? "bg-red-500" : "bg-orange-500"
            }`}
          />
        )}

        {/* Tooltip (collapsed) */}
        {collapsed && (
          <span
            className="
              pointer-events-none absolute left-full ml-3
              whitespace-nowrap rounded-lg
              bg-slate-800 dark:bg-slate-900 px-3 py-1.5
              text-xs font-medium text-white
              shadow-xl border border-border dark:border-white/10
              opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-200 z-[60]
            "
          >
            {item.label}
            {item.badge && (
              <span className="ml-2 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Content                                                    */
/* ------------------------------------------------------------------ */
function SidebarBody({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
      {navGroups.map((group) => (
        <div key={group.title}>
          {/* Group header */}
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              {group.title}
            </p>
          )}
          {collapsed && <div className="mx-auto mb-1.5 w-6 border-t border-slate-200 dark:border-white/[0.06]" />}

          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={checkActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Layout                                                       */
/* ------------------------------------------------------------------ */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Mounted state for hydration fix
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (!mounted || status === "loading") {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0f0a16]" />;
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0f0a16]" />;
  }

  if (String(session?.user?.role || "").toUpperCase() !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center dark:bg-[#0f0a16]">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#1a0f26]">
          <ShieldCheck size={36} className="mx-auto text-[#7C3AED]" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This area is restricted to platform administrators.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-[#0f0a16] overflow-hidden flex">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-white/10
          text-muted-foreground dark:text-slate-300
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary shrink-0" />
            <span className="font-bold text-lg tracking-wide text-foreground dark:text-white">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarBody
          collapsed={false}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* Mobile footer */}
        <div className="px-3 pb-4 border-t border-slate-200 dark:border-white/10 pt-3 space-y-1">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white transition-colors">
              <Sparkles size={19} className="shrink-0" />
              <span className="text-[13px] font-medium">Back to App</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7C3AED]   flex items-center justify-center text-white text-sm font-bold shrink-0">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground dark:text-white truncate">Admin</p>
              <p className="text-[11px] text-muted-foreground truncate">admin@studybuddy.com</p>
            </div>
            <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col relative h-screen
          bg-white dark:bg-[#0a0a0f] border-r border-slate-200 dark:border-white/10
          text-muted-foreground dark:text-slate-300
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Desktop header */}
        <div
          className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-white/10 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div
            className={`flex items-center gap-2 overflow-hidden ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <ShieldCheck size={22} className="text-primary shrink-0" />
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">
                Admin Panel
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed((p) => !p)}
            className={`
              p-1.5 rounded-lg text-muted-foreground dark:text-slate-400
              hover:text-foreground dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors
              ${
                isCollapsed
                  ? "absolute -right-3 top-5 bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 shadow-lg z-10"
                  : ""
              }
            `}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} className="transition-transform duration-300" />
            ) : (
              <ChevronLeft size={16} className="transition-transform duration-300" />
            )}
          </button>
        </div>

        <SidebarBody collapsed={isCollapsed} pathname={pathname} />

        {/* Desktop footer */}
        <div className="px-2.5 pb-3 border-t border-slate-200 dark:border-white/10 pt-3 space-y-0.5">
          {/* Back to App */}
          <Link href="/dashboard">
            <div
              className={`
                group relative flex items-center gap-3 rounded-xl
                text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]
                hover:text-slate-900 dark:hover:text-white transition-colors
                ${isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
              `}
            >
              <Sparkles size={19} className="shrink-0 group-hover:text-primary transition-colors" />
              {!isCollapsed && (
                <span className="text-[13px] font-medium">Back to App</span>
              )}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-800 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-border dark:border-white/10 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-[60]">
                  Back to App
                </span>
              )}
            </div>
          </Link>

          {/* Admin avatar + logout */}
          <div
            className={`flex items-center rounded-xl ${
              isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#7C3AED]   flex items-center justify-center text-white text-sm font-bold shrink-0">
              A
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground dark:text-white truncate">
                    Admin
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    admin@studybuddy.com
                  </p>
                </div>
                <button
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col">
        {/* Sticky top header */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-white/10 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-md">
          {/* Left: hamburger (mobile) + search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Global admin search */}
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users, reports..."
                className="w-64 lg:w-80 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              className="relative p-2.5 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0a16]" />
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {/* 👇 The Hydration Fix is right here 👇 */}
              {mounted ? (
                theme === "dark" ? <Sun size={19} /> : <Moon size={19} />
              ) : (
                <div className="w-[19px] h-[19px]" /> 
              )}
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

            {/* Admin profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#7C3AED]   flex items-center justify-center text-white text-xs font-bold shrink-0">
                  AD
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground dark:text-white">
                  Admin
                </span>
                <ChevronDown
                  size={15}
                  className={`hidden md:block text-muted-foreground transition-transform duration-200 ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-50 py-1.5 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                      <p className="text-sm font-semibold text-foreground dark:text-white">
                        Admin User
                      </p>
                      <p className="text-xs text-muted-foreground">
                        admin@studybuddy.com
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileOpen(false)}
                      >
                        <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <Settings size={15} />
                          Platform Settings
                        </div>
                      </Link>
                      <Link
                        href="/admin/notifications"
                        onClick={() => setProfileOpen(false)}
                      >
                        <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                          <Bell size={15} />
                          Notifications
                        </div>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 dark:border-white/[0.06] pt-1">
                      <button className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}

