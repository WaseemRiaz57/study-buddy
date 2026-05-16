"use client";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { useOfflinePresence } from "@/hooks/useOfflinePresence";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  useOfflinePresence();

  useEffect(() => {
    if (status !== "authenticated") return;

    const awardDailyLogin = async () => {
      const response = await fetch("/api/user/gamification-stats", {
        method: "POST",
      });

      if (response.ok) {
        window.dispatchEvent(new Event("gamification-stats-updated"));
      }
    };

    void awardDailyLogin();
  }, [status]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <DashboardTopbar />
        {children}
      </main>
    </div>
  );
}
