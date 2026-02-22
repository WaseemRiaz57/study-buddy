"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  CircleDollarSign,
  ShieldAlert,
  Settings,
  Sparkles,
  ChevronLeft,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/* ------------------------------------------------------------------ */
/* Admin nav items                                                    */
/* ------------------------------------------------------------------ */
interface AdminNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  {
    icon: UserCheck,
    label: "Approvals",
    href: "/admin/approvals",
    badge: "3",
    badgeColor: "bg-orange-500 text-white",
  },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: CircleDollarSign, label: "Financials", href: "/admin/financials" },
  { icon: ShieldAlert, label: "Content & Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

/* ------------------------------------------------------------------ */
/* Admin Layout                                                       */
/* ------------------------------------------------------------------ */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  /* ---- Sidebar content (shared between desktop & mobile) ---- */
  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Header */}
      <div
        className={`flex items-center h-16 px-4 border-b border-border dark:border-white/[0.06] ${
          !mobile && sidebarCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-2 overflow-hidden ${
            !mobile && sidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <ShieldAlert
            size={22}
            className="text-purple-600 dark:text-purple-400 shrink-0"
          />
          {(mobile || !sidebarCollapsed) && (
            <span className="font-bold text-lg tracking-wide text-foreground dark:text-white whitespace-nowrap">
              Admin Panel
            </span>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        {!mobile && (
          <button
            onClick={() => setSidebarCollapsed((p) => !p)}
            className={`
              p-1.5 rounded-lg text-muted-foreground dark:text-slate-400
              hover:text-foreground dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-white/10 transition-colors
              ${
                sidebarCollapsed
                  ? "absolute -right-3 top-5 bg-background dark:bg-[#0a0a0f] border border-border dark:border-white/10 shadow-lg z-10"
                  : ""
              }
            `}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Close button (mobile only) */}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {adminNavItems.map((item) => {
          const active = isActive(item.href);
          const collapsed = !mobile && sidebarCollapsed;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
            >
              <div
                className={`
                  group relative flex items-center gap-3 rounded-xl
                  transition-all duration-200 overflow-hidden
                  ${collapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${
                    active
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:shadow-[inset_0_0_20px_rgba(140,48,232,0.08)]"
                      : "text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-purple-600 dark:bg-purple-400" />
                )}

                <item.icon
                  size={20}
                  className={`shrink-0 ${
                    active
                      ? "text-purple-600 dark:text-purple-400"
                      : "group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  }`}
                />

                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {!collapsed && item.badge && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor ||
                      "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed badge dot */}
                {collapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500" />
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

      {/* Back to app link */}
      {(mobile || !sidebarCollapsed) && (
        <div className="px-3 pb-4 border-t border-border dark:border-white/[0.06] pt-3">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white transition-colors">
              <Sparkles size={20} className="shrink-0" />
              <span className="text-sm font-medium">Back to App</span>
            </div>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f0a16] overflow-hidden relative">
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
          fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col
          bg-background dark:bg-[#0a0a0f] border-r border-border dark:border-white/[0.06]
          text-muted-foreground dark:text-slate-300
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent mobile />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col relative h-screen
          bg-background dark:bg-[#0a0a0f] border-r border-border dark:border-white/[0.06]
          text-muted-foreground dark:text-slate-300 transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "w-20" : "w-[280px]"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col">
        {/* Admin top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border dark:border-white/[0.06] bg-white/80 dark:bg-[#0f0a16]/80 backdrop-blur-xl">
          {/* Left: hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Admin profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground dark:text-white">
                  Admin
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform duration-200 ${
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
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-50 py-2">
                    <div className="px-4 py-2 border-b border-border dark:border-white/[0.06]">
                      <p className="text-sm font-semibold text-foreground dark:text-white">
                        Admin User
                      </p>
                      <p className="text-xs text-muted-foreground">
                        admin@studybuddy.com
                      </p>
                    </div>
                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileOpen(false)}
                    >
                      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <Settings size={16} />
                        Settings
                      </div>
                    </Link>
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <LogOut size={16} />
                      Logout
                    </button>
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
