"use client";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { useOfflinePresence } from "@/hooks/useOfflinePresence";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useOfflinePresence();

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
