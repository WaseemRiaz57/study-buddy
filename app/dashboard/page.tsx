"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/useUserStore";
import { StudentDashboard } from "./student-view";
import { MentorDashboard } from "./mentor-view";

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