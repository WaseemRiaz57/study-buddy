"use client";

import { useEffect } from "react";
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
      <Sidebar initialRole={initialRole} initialPlan={initialPlan} />
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <DashboardTopbar />
        {children}
      </main>
    </div>
  );
}

