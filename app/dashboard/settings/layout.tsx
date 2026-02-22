"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  ShieldCheck,
  Bell,
  BookOpen,
  CreditCard,
  Briefcase,
  Wallet,
  Trash2,
  type LucideIcon,
} from "lucide-react";

// 👇 Zustand store import karein
import { useUserStore } from "@/store/useUserStore";

/* ------------------------------------------------------------------ */
/* Navigation definitions                                             */
/* ------------------------------------------------------------------ */
interface SettingsNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface SettingsNavGroup {
  title: string;
  items: SettingsNavItem[];
}

const commonLinks: SettingsNavItem[] = [
  { icon: User, label: "Public Profile", href: "/dashboard/settings/profile" }, // Updated href
  {
    icon: ShieldCheck,
    label: "Account & Security",
    href: "/dashboard/settings/security",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/dashboard/settings/notifications",
  },
];

const studentOnly: SettingsNavItem[] = [
  {
    icon: BookOpen,
    label: "Study Plan",
    href: "/dashboard/settings/study-plan",
  },
];

const mentorOnly: SettingsNavItem[] = [
  {
    icon: Briefcase,
    label: "Mentorship Setup",
    href: "/dashboard/settings/mentorship",
  },
];

const billingLinks: SettingsNavItem[] = [
  {
    icon: CreditCard,
    label: "Subscription Plan",
    href: "/dashboard/settings/subscription",
  },
  {
    icon: Wallet,
    label: "Billing & Payments",
    href: "/dashboard/settings/billing",
  },
];

function getNavGroups(role: "student" | "mentor"): SettingsNavGroup[] {
  return [
    { title: "My Account", items: commonLinks },
    {
      title: role === "student" ? "Learning" : "Teaching",
      items: role === "student" ? studentOnly : mentorOnly,
    },
    { title: "Billing", items: billingLinks },
  ];
}

function flatItems(groups: SettingsNavGroup[]): SettingsNavItem[] {
  return groups.flatMap((g) => g.items);
}

/* ------------------------------------------------------------------ */
/* Mini Profile (sidebar header)                                      */
/* ------------------------------------------------------------------ */
function MiniProfile({ role }: { role: "student" | "mentor" }) {
  return (
    <div className="p-6 border-b border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-4">
        <div className="size-12 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm select-none">
          WR
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate">
            Waseem Riaz
          </h3>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 mt-1 capitalize">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Navigation Link                                            */
/* ------------------------------------------------------------------ */
function NavLink({
  item,
  isActive,
}: {
  item: SettingsNavItem;
  isActive: boolean;
}) {
  return (
    <li>
      <Link
        href={item.href}
        className={`
          relative group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg
          transition-colors
          ${
            isActive
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/[0.04]"
          }
        `}
      >
        {isActive && (
          <motion.div
            layoutId="settings-active-indicator"
            className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <item.icon size={20} className="shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile Horizontal Scrollable Tab Menu                              */
/* ------------------------------------------------------------------ */
function MobileNav({
  items,
  pathname,
}: {
  items: SettingsNavItem[];
  pathname: string;
}) {
  return (
    <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
      <div className="flex overflow-x-auto scrollbar-none px-4 py-2 gap-1">
        {items.map((item) => {
          const active = pathname.includes(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-medium
                  transition-colors shrink-0
                  ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06]"
                  }
                `}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings Layout                                                    */
/* ------------------------------------------------------------------ */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 👇 Get role from Zustand Store
  const { role } = useUserStore();
  
  // Convert 'STUDENT' | 'MENTOR' to lowercase 'student' | 'mentor' for our logic
  const normalizedRole = (role?.toLowerCase() || "student") as "student" | "mentor";

  const navGroups = getNavGroups(normalizedRole);
  const allItems = flatItems(navGroups);

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account preferences and configuration
          </p>
        </div>

        <MobileNav items={allItems} pathname={pathname} />

        <div className="flex flex-col md:flex-row">
          <aside className="w-[280px] hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-l-2xl overflow-y-auto min-h-[600px]">
            <MiniProfile role={normalizedRole} />

            <nav className="flex-1 px-4 py-6 space-y-8">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    {group.title}
                  </h4>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 mt-auto">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors">
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}