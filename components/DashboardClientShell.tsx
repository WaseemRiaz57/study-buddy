"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import ReviewModal from "@/components/mentorship/ReviewModal";
import { Sidebar } from "@/components/sidebar";
import { StudyBuddyRealtimeRequests } from "@/components/study-buddy/StudyBuddyRealtimeRequests";
import { useActiveTimeReward } from "@/hooks/useActiveTimeReward";
import { useOfflinePresence } from "@/hooks/useOfflinePresence";
import { useGamificationStore } from "@/store/useGamificationStore";
import { type Plan, type Role, useUserStore } from "@/store/useUserStore";

interface DashboardClientShellProps {
  children: React.ReactNode;
  initialRole: Role;
  initialPlan: Plan;
  mentorAccessStatus?: "approved" | "pending" | "not_submitted";
}

export function DashboardClientShell({
  children,
  initialRole,
  initialPlan,
  mentorAccessStatus = "approved",
}: DashboardClientShellProps) {
  const pathname = usePathname();
  const setRole = useUserStore((state) => state.setRole);
  const setPlan = useUserStore((state) => state.setPlan);
  const setInitialGamificationData = useGamificationStore(
    (state) => state.setInitialData
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [completedReviewSession, setCompletedReviewSession] = useState<{
    sessionId: string;
    mentorName: string;
    subject: string;
  } | null>(null);

  useOfflinePresence();
  useActiveTimeReward();

  const isMentorRole = initialRole === "TEACHER" || initialRole === "MENTOR";
  const isMentorRestricted = isMentorRole && mentorAccessStatus !== "approved";
  const isSettingsRoute = pathname.startsWith("/dashboard/settings");
  const shouldBlockContent = isMentorRestricted && !isSettingsRoute;

  useEffect(() => {
    setRole(initialRole);
    setPlan(initialPlan);
  }, [initialPlan, initialRole, setPlan, setRole]);

  useEffect(() => {
    let isActive = true;

    const hydrateGamificationTotals = async () => {
      const response = await fetch("/api/user/gamification-stats", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (isActive && response.ok && data?.stats) {
        setInitialGamificationData(
          Number(data.stats.xp || 0),
          Number(data.stats.coins || 0),
          data.stats
        );
      }
    };

    void hydrateGamificationTotals();

    return () => {
      isActive = false;
    };
  }, [setInitialGamificationData]);

  useEffect(() => {
    function handleMentorSessionCompleted(event: Event) {
      const detail = (event as CustomEvent<{
        sessionId?: string;
        mentorName?: string;
        subject?: string;
      }>).detail;
      const sessionId = String(detail?.sessionId || "").trim();

      if (!sessionId) return;

      setCompletedReviewSession({
        sessionId,
        mentorName: String(detail?.mentorName || "Mentor"),
        subject: String(detail?.subject || "Mentorship session"),
      });
    }

    window.addEventListener("mentor-session-completed", handleMentorSessionCompleted);
    return () => {
      window.removeEventListener("mentor-session-completed", handleMentorSessionCompleted);
    };
  }, []);

  useEffect(() => {
    const awardDailyLogin = async () => {
      const response = await fetch("/api/user/gamification-stats", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.stats) {
          setInitialGamificationData(
            Number(data.stats.xp || 0),
            Number(data.stats.coins || 0),
            data.stats
          );
        }
        window.dispatchEvent(new Event("gamification-stats-updated"));
      }
    };

    void awardDailyLogin();
  }, [setInitialGamificationData]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar initialRole={initialRole} initialPlan={initialPlan} />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative h-full w-fit shadow-2xl">
            <Sidebar
              initialRole={initialRole}
              initialPlan={initialPlan}
              mobile
              onClose={() => setMobileSidebarOpen(false)}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300">
        <DashboardTopbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <div className="mx-auto w-full max-w-screen-2xl pb-20">
          {isMentorRestricted && (
            <section
              aria-label="Mentor account access status"
              className="mx-4 mt-4 rounded-2xl border border-[#7C3AED]/25 bg-[#7C3AED]/10 p-4 text-sm shadow-sm sm:mx-6 lg:mx-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-foreground">
                  {mentorAccessStatus === "pending"
                    ? "⏳ Your mentor application is currently pending admin approval. Features are locked."
                    : "⚠️ Your account is restricted. Please complete your mentorship configuration to unlock features."}
                </p>
                {mentorAccessStatus === "not_submitted" && (
                  <Link
                    href="/dashboard/settings/mentorship"
                    prefetch
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                  >
                    Complete Configuration
                  </Link>
                )}
              </div>
            </section>
          )}

          {shouldBlockContent ? (
            <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                  Access Locked
                </p>
                <h1 className="mt-3 text-2xl font-extrabold text-foreground">
                  Mentor approval required
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Your dashboard tools will unlock after your mentor application is approved by an admin.
                </p>
                {mentorAccessStatus === "not_submitted" && (
                  <Link
                    href="/dashboard/settings/mentorship"
                    prefetch
                    className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                  >
                    Complete Configuration
                  </Link>
                )}
              </div>
            </section>
          ) : (
            children
          )}
        </div>
      </main>

      <ReviewModal
        isOpen={Boolean(completedReviewSession)}
        sessionId={completedReviewSession?.sessionId || ""}
        mentorName={completedReviewSession?.mentorName || "Mentor"}
        subject={completedReviewSession?.subject || "Mentorship session"}
        onClose={() => setCompletedReviewSession(null)}
        onSubmitted={() => setCompletedReviewSession(null)}
      />
      {initialRole === "STUDENT" && <StudyBuddyRealtimeRequests />}
    </div>
  );
}

