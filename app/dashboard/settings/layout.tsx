"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Bell,
  BookOpen,
  CreditCard,
  Briefcase,
  Trash2,
  ArrowLeft,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  { icon: ShieldAlert, label: "Trust & Safety", href: "/dashboard/settings/trust-safety" },
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
        <div className="size-14 shrink-0 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-slate-800 shadow-md">
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
          <span className="inline-flex items-center rounded-full bg-purple-600/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 ring-1 ring-inset ring-purple-600/20 mt-1 capitalize">
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const normalizedRole = (role?.toLowerCase() || "student") as "student" | "mentor";
  const navGroups = getNavGroups(normalizedRole);

  // 👇 Ye logic check karegi ke user Menu par hai ya kisi feature k andar
  const isRootMenu = pathname === "/dashboard/settings" || pathname === "/dashboard/settings/";

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/settings/account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account.");
      }

      toast.success(
        "Your account has been deleted successfully. We are sorry to see you go!"
      );
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account."
      );
      setIsDeletingAccount(false);
    }
  };

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
                    <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-purple-600 mb-3">
                      {group.title}
                    </h4>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-600 dark:text-slate-300 dark:hover:bg-white/[0.04] transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon size={20} className="text-slate-400 group-hover:text-purple-600 transition-colors" aria-hidden="true" />
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
                <button
                  type="button"
                  aria-label="Delete account"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={18} aria-hidden="true" />
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

      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-500/30 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-account-title"
                  className="text-xl font-bold text-slate-900 dark:text-white"
                >
                  Delete account?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  WARNING: This action is irreversible. Your account, student
                  profile, OTP records, and saved AI notes will be removed.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close delete account dialog"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                aria-label="Cancel account deletion"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                aria-label="Permanently delete account"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccount}
                className="inline-flex min-w-[172px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingAccount && (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                )}
                {isDeletingAccount ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

