"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  User,
  ShieldCheck,
  Bell,
  BookOpen,
  CreditCard,
  Briefcase,
  Trash2,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

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

// ⚠️ Note: Make sure 'Public Profile' goes to '/dashboard/settings/profile'
const commonLinks: SettingsNavItem[] = [
  { icon: User, label: "Public Profile", href: "/dashboard/settings/profile" },
  { icon: ShieldCheck, label: "Account & Security", href: "/dashboard/settings/security" },
  { icon: Bell, label: "Notifications", href: "/dashboard/settings/notifications" },
];

const studentOnly: SettingsNavItem[] = [
  { icon: BookOpen, label: "Study Plan", href: "/dashboard/settings/study-plan" },
];

const mentorOnly: SettingsNavItem[] = [
  { icon: Briefcase, label: "Mentorship Setup", href: "/dashboard/settings/mentorship" },
];

const subscriptionLink: SettingsNavItem = {
  icon: CreditCard, label: "Subscription Plan", href: "/dashboard/settings/subscription",
};

function getNavGroups(role: "student" | "mentor"): SettingsNavGroup[] {
  return [
    { title: "My Account", items: commonLinks },
    {
      title: role === "student" ? "Learning" : "Teaching",
      items: role === "student" ? studentOnly : mentorOnly,
    },
    { title: "Billing", items: [subscriptionLink] },
  ];
}

/* ------------------------------------------------------------------ */
/* Mini Profile (Header for the Menu)                                 */
/* ------------------------------------------------------------------ */
function MiniProfile({ role }: { role: "student" | "mentor" }) {
  const { data: session, status } = useSession();
  const fullName = session?.user?.name || "User";
  const userImage = session?.user?.image || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1f1627] rounded-t-2xl">
      <div className="flex items-center gap-4">
        <div className="size-14 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-slate-800 shadow-md">
          {userImage ? (
            <Image
              src={userImage}
              alt="User profile picture"
              width={56}
              height={56}
              priority
              unoptimized
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight truncate">
            {status === "loading" ? "Loading..." : fullName}
          </h3>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary ring-1 ring-inset ring-primary/20 mt-1 capitalize">
            {role} Account
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings Layout Engine                                             */
/* ------------------------------------------------------------------ */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role } = useUserStore();
  const normalizedRole = (role?.toLowerCase() || "student") as "student" | "mentor";
  const navGroups = getNavGroups(normalizedRole);

  // 👇 Ye logic check karegi ke user Menu par hai ya kisi feature k andar
  const isRootMenu = pathname === "/dashboard/settings" || pathname === "/dashboard/settings/";

  return (
    // 👇 FIX: min-h-screen ki jagah h-full aur overflow-y-auto laga diya hai
    <div className="h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Dynamic Header: Shows 'Back' button if inside a feature */}
        <div className="mb-6 lg:mb-8 flex items-center gap-4">
          {!isRootMenu && (
            <Link 
              href="/dashboard/settings" 
              className="p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all transform hover:-translate-x-1"
            >
              <ArrowLeft className="text-slate-700 dark:text-slate-300" size={20} />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRootMenu ? "Settings Menu" : "Settings"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRootMenu ? "Select an option to manage your account" : "Configure your preferences below"}
            </p>
          </div>
        </div>

        <div className="flex flex-col w-full pb-10">
          
          {/* ── MENUBAR (Only visible when on root /dashboard/settings) ── */}
          {isRootMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md mx-auto flex flex-col shrink-0 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] rounded-2xl shadow-xl"
            >
              <MiniProfile role={normalizedRole} />

              <nav className="flex-1 px-4 py-6 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-primary mb-3">
                      {group.title}
                    </h4>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-white/[0.04] transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                              <span>{item.label}</span>
                            </div>
                            {/* Chota sa right arrow icon hint ke liye */}
                            <span className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
                              ❯
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1f1627] rounded-b-2xl">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </motion.div>
          )}

          {/* ── FEATURE CONTENT AREA (Only visible when a feature is clicked) ── */}
          {!isRootMenu && (
            <motion.main 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 w-full"
            >
              {children}
            </motion.main>
          )}

        </div>
      </div>
    </div>
  );
}
