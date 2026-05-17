"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { StudentDashboard } from "./student-view";
import { MentorDashboard } from "./mentor-view";
import { Megaphone, X } from "lucide-react";

type DashboardAnnouncement = {
  id: string;
  title: string;
  content: string;
  targetAudience: "all" | "students" | "mentors";
  expiresAt: string | null;
};

function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

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
        <div
          key={announcement.id}
          className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/10 p-4 text-foreground shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
              <Megaphone size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-foreground">
                {announcement.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {announcement.content}
              </p>
            </div>
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
        </div>
      ))}
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
    return <div className="p-10 text-center">Loading StudyBuddy...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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
