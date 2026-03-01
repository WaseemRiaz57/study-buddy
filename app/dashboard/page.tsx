"use client";

import { StudentDashboard } from "./student-view";
import { MentorDashboard } from "./mentor-view";
import { useUserStore } from "@/store/useUserStore"; // 👈 1. Store ko import kiya

export default function DashboardPage() {
  // 👈 2. Hardcoded value hata kar Zustand store se real-time role get kar liya
  const role = useUserStore((s) => s.role);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Conditional Rendering Logic */}
        {role === "STUDENT" ? (
          <StudentDashboard />
        ) : (
          <MentorDashboard />
        )}
        
      </div>
    </main>
  );
}