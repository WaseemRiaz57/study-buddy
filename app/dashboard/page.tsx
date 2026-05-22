"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { ProductTour } from "@/components/ProductTour";
import { StudentDashboard } from "./student-view";
import { MentorDashboard } from "./mentor-view";
import DashboardLoading from "./loading";
import { Megaphone, X } from "lucide-react";

type DashboardAnnouncement = {
  id: string;
  title: string;
  content: string;
  targetAudience: "all" | "students" | "mentors";
  expiresAt: string | null;
  createdAt?: string | null;
};

function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<DashboardAnnouncement | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setAnnouncements(
        Array.isArray(data.announcements) ? data.announcements : []
      );
    } catch {
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.includes(announcement.id)
  );

  if (!visibleAnnouncements.length) return null;

  return (
    <section className="mb-6 space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <article
          key={announcement.id}
          className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-4 text-foreground shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
              <Megaphone size={18} />
            </div>
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(announcement)}
              className="min-w-0 flex-1 text-left"
              aria-label={`View announcement ${announcement.title}`}
            >
              <h2 className="truncate text-sm font-bold text-foreground">
                {announcement.title}
              </h2>
              <p className="mt-1 line-clamp-1 text-sm leading-relaxed text-muted-foreground">
                {announcement.content}
              </p>
              <span className="mt-1 inline-flex text-xs font-bold text-[#7C3AED]">
                View
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setDismissedIds((current) => [...current, announcement.id])
              }
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
              aria-label={`Dismiss ${announcement.title}`}
            >
              <X size={16} />
            </button>
          </div>
        </article>
      ))}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={selectedAnnouncement.title}
            className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#191121]"
          >
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                  Announcement
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-foreground">
                  {selectedAnnouncement.title}
                </h2>
                {selectedAnnouncement.createdAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
                aria-label="Close announcement dialog"
              >
                <X size={18} />
              </button>
            </header>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {selectedAnnouncement.content}
            </p>
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const role = useUserStore((s) => s.role);
  const setRole = useUserStore((s) => s.setRole);

  useEffect(() => {
    // 1. Check karein ke session load ho gaya hai aur us mein role mojood hai
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role.toUpperCase(); // Case-sensitivity fix
      
      // 2. Zustand store ko update karein agar wo default par hai
      if (role !== userRole) {
        setRole(userRole as any);
      }
    }
  }, [session, status, role, setRole]);

  // Loading state taake galat dashboard nazar na aaye
  if (status === "loading") {
    return <DashboardLoading />;
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <ProductTour />
      <div className="tour-dashboard-overview max-w-7xl mx-auto">
        <DashboardAnnouncements />
        {/* Real-time role based rendering */}
        {role === "MENTOR" ? (
          <MentorDashboard />
        ) : (
          <StudentDashboard />
        )}
      </div>
    </main>
  );
}

