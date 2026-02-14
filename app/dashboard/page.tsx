"use client";

import { StudentDashboard } from "./student-view";
import { MentorDashboard } from "./mentor-view";

export default function DashboardPage() {
  // 👇 TEST KARNE KE LIYE ISAY CHANGE KAREIN: "student" ya "mentor"
  const userRole = "student"; // ya "student"

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Conditional Rendering Logic */}
        {userRole === "student" ? (
          <StudentDashboard />
        ) : (
          <MentorDashboard />
        )}
        
      </div>
    </main>
  );
}