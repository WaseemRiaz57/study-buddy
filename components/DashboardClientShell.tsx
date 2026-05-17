"use client";

import { useEffect, useState } from "react";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { Sidebar } from "@/components/sidebar";
import { useOfflinePresence } from "@/hooks/useOfflinePresence";
import { type Plan, type Role, useUserStore } from "@/store/useUserStore";

interface DashboardClientShellProps {
  children: React.ReactNode;
  initialRole: Role;
  initialPlan: Plan;
}

export function DashboardClientShell({
  children,
  initialRole,
  initialPlan,
}: DashboardClientShellProps) {
  const setRole = useUserStore((state) => state.setRole);
  const setPlan = useUserStore((state) => state.setPlan);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useOfflinePresence();

  useEffect(() => {
    setRole(initialRole);
    setPlan(initialPlan);
  }, [initialPlan, initialRole, setPlan, setRole]);

  useEffect(() => {
    const awardDailyLogin = async () => {
      const response = await fetch("/api/user/gamification-stats", {
        method: "POST",
      });

      if (response.ok) {
        window.dispatchEvent(new Event("gamification-stats-updated"));
      }
    };

    void awardDailyLogin();
  }, []);

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

      <main className="min-w-0 flex-1 overflow-y-auto transition-all duration-300">
        <DashboardTopbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <div className="mx-auto w-full max-w-screen-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

