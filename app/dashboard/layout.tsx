import { StudentSidebar } from "@/components/student-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}