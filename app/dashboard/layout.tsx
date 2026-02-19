"use client";
import { Sidebar } from "@/components/sidebar";
import { useUserStore } from "@/store/useUserStore";

// Temporary Dev Switcher (Production mein isay hata denge)
function DevRoleSwitcher() {
  const { role, plan, setRole, setPlan } = useUserStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 p-3 bg-slate-900 border border-white/20 rounded-xl shadow-2xl text-xs text-white">
      <p className="font-bold text-purple-400 mb-1">🛠️ Dev Tools</p>
      
      <div className="flex gap-2">
        <button onClick={() => setRole('STUDENT')} className={`px-2 py-1 rounded ${role === 'STUDENT' ? 'bg-purple-600' : 'bg-white/10'}`}>Student</button>
        <button onClick={() => setRole('MENTOR')} className={`px-2 py-1 rounded ${role === 'MENTOR' ? 'bg-purple-600' : 'bg-white/10'}`}>Mentor</button>
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={() => setPlan('COMMUNITY')} className={`px-2 py-1 rounded ${plan === 'COMMUNITY' ? 'bg-blue-600' : 'bg-white/10'}`}>Free</button>
        <button onClick={() => setPlan('PRO')} className={`px-2 py-1 rounded ${plan === 'PRO' ? 'bg-blue-600' : 'bg-white/10'}`}>Pro</button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        {children}
      </main>
      
      {/* Dev Switcher Rendered Here */}
      <DevRoleSwitcher />
    </div>
  );
}