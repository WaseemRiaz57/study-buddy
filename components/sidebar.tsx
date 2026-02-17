"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Video, 
  Headphones, 
  UserPlus, 
  MessageSquare, 
  Library, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Content Generator", href: "/dashboard/content-generator" },
  { icon: Users, label: "Mentorship System", href: "/dashboard/mentorship" },
  { icon: Video, label: "Study Room", href: "/dashboard/study-rooms" },
  { icon: Headphones, label: "Focus Rooms", href: "/dashboard/focus-rooms" },
  { icon: UserPlus, label: "Study with Buddy", href: "/dashboard/buddy" },
  { icon: MessageSquare, label: "Community", href: "/dashboard/community" },
  { icon: Library, label: "Resource Hub", href: "/dashboard/resources" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <motion.aside 
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#0f0a16] border-r border-white/10 text-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8 px-2">
            <Sparkles className="text-primary" size={24} />
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">StudyBuddy</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                    isActive 
                      ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_20px_rgba(140,48,232,0.4)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}>
                    <item.icon size={18} className={isActive ? "text-white" : "group-hover:text-primary transition-colors"} />
                    <span className="font-medium text-sm z-10">{item.label}</span>
                    
                    {/* Hover Glow Effect */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
}
