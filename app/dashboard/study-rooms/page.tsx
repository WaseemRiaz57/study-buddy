"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Clock3, Radio, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import CreateRoomModal from "@/components/study-room/CreateRoomModal";

type Room = {
  id: string;
  title: string;
  subject: string;
  liveCount: number;
  capacity: number;
};

const ROOM_LIST: Room[] = [
  { id: "101", title: "Operating Systems - Ch 5", subject: "CS 302", liveCount: 4, capacity: 10 },
  { id: "102", title: "Linear Algebra Problem Set", subject: "MATH 210", liveCount: 6, capacity: 12 },
  { id: "103", title: "Organic Chemistry Review", subject: "CHEM 240", liveCount: 5, capacity: 8 },
  { id: "104", title: "Business Case Analysis", subject: "BUS 115", liveCount: 3, capacity: 6 },
];

export default function StudyRoomsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <main className="relative z-10 flex-1 px-4 md:px-8 py-8 pb-20 bg-slate-50 dark:bg-[#0f0c13] min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* Background Decoration */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-0 dark:opacity-100 transition-opacity">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8c30e8]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4fd1c5]/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl flex flex-col gap-8 relative z-10">
          
          {/* ── HEADER SECTION (Updated) ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-600 to-purple-600 dark:from-[#4fd1c5] dark:via-[#63b3ed] dark:to-[#8c30e8]">
                  Group Sanctuaries
                </span>
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-lg font-light">
                Connect with peers, find your focus flow.
              </p>
            </div>

            {/* ✨ NEW BUTTON POSITION (Like Study with Buddy) */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-purple-500/25
                bg-gradient-to-r from-[#8c30e8] to-[#e830d5]"
            >
              <Plus size={20} />
              Forge New Room
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full h-12 rounded-xl pl-12 pr-4 transition-all
                  bg-white border border-slate-200 text-slate-900 placeholder-slate-400
                  dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Search for a topic..."
                type="text"
              />
            </div>
            <div className="flex gap-3">
              <button className="px-4 h-12 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all
                bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:border-[#4fd1c5]/30">
                <SlidersHorizontal size={16} />
                Subject
              </button>
              <button className="px-4 h-12 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all
                bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:border-[#4fd1c5]/30">
                <Clock3 size={16} />
                Duration
              </button>
            </div>
          </div>

          {/* ── ROOM GRID (Cleaned) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Note: Removed the "Create Card" from here */}

            {/* Room Cards */}
            {ROOM_LIST.map((room) => (
              <article
                key={room.id}
                onClick={() => router.push(`/dashboard/study-rooms/${room.id}`)}
                className="group cursor-pointer relative flex flex-col p-5 h-64 rounded-2xl transition-all duration-300 hover:-translate-y-1
                  bg-white border border-slate-200 shadow-sm hover:shadow-md
                  dark:bg-white/5 dark:border-white/10 dark:hover:border-[#4fd1c5]/30 dark:shadow-none backdrop-blur-md"
              >
                {/* Live Badge */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-teal-500 dark:bg-[#4fd1c5] animate-pulse" />
                    <span className="text-xs font-bold text-teal-600 dark:text-[#4fd1c5] tracking-wide uppercase inline-flex items-center gap-1">
                      <Radio size={12} />
                      Live
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{room.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 rounded-md text-xs font-medium
                      bg-slate-100 text-slate-600 border border-slate-200
                      dark:bg-white/5 dark:text-white/70 dark:border-white/10">
                      {room.subject}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f0c13] bg-slate-200 dark:bg-gray-700" />
                    ))}
                  </div>
                  <div className="text-slate-500 dark:text-white/60 text-sm font-medium flex items-center gap-1">
                    <Users size={14} />
                    {room.liveCount}/{room.capacity}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}