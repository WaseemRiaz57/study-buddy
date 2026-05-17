"use client";

import { Clock3, Sparkles, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";

type SessionSummaryProps = {
  onReturn?: () => void;
};

export default function SessionSummary({ onReturn }: SessionSummaryProps) {
  const router = useRouter();

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
      return;
    }
    router.push("/dashboard/study-rooms");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f6f8] dark:bg-[#191121] p-8">
      <header className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center gap-2 p-2 bg-[#8c30e8]/5 rounded-full mb-4 text-[#8c30e8] font-bold text-sm uppercase">
          <Sparkles size={14} />
          Session Complete
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-[#7C3AED] bg-[#7C3AED]   pb-2">
          Great Collaboration!
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-white/70 dark:bg-[#1d1429]/70 border border-[#8c30e8]/10 rounded-2xl p-6 flex flex-col items-center shadow-lg backdrop-blur-md">
          <div className="p-3 bg-[#8c30e8]/5 rounded-full mb-3 text-[#8c30e8]">
            <Clock3 size={28} />
          </div>
          <p className="text-slate-500 text-sm font-semibold uppercase">Duration</p>
          <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">1h 15m</p>
        </div>

        <div className="bg-white/70 dark:bg-[#1d1429]/70 border border-[#8c30e8]/10 rounded-2xl p-6 flex flex-col items-center shadow-lg backdrop-blur-md">
          <div className="p-3 bg-[#8c30e8]/5 rounded-full mb-3 text-[#8c30e8]">
            <Users size={28} />
          </div>
          <p className="text-slate-500 text-sm font-semibold uppercase">Participants</p>
          <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">6</p>
        </div>

        <div className="bg-white/70 dark:bg-[#1d1429]/70 border border-[#8c30e8]/10 rounded-2xl p-6 flex flex-col items-center shadow-lg backdrop-blur-md">
          <div className="p-3 bg-[#8c30e8]/5 rounded-full mb-3 text-[#8c30e8]">
            <Trophy size={28} />
          </div>
          <p className="text-slate-500 text-sm font-semibold uppercase">XP Earned</p>
          <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1">+150</p>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-6 bg-[#7C3AED]  /5  /10 border border-[#8c30e8]/10 rounded-3xl p-8 relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            +150 <span className="text-[#8c30e8]">Harmony XP</span>
          </h2>
          <p className="text-slate-500 mt-2 text-sm">Excellent group synergy detected.</p>
        </div>
        <div className="w-full md:w-1/2">
          <div className="flex justify-between items-end mb-1 text-sm font-bold text-[#8c30e8]">
            <span>Level 4</span>
            <span>85%</span>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#8c30e8] w-[85%]" />
          </div>
        </div>
      </div>

      <button
        onClick={handleReturn}
        className="mt-10 bg-[#8c30e8] text-white text-lg font-bold py-4 px-12 rounded-xl shadow-lg hover:shadow-[#8c30e8]/40 transition-all"
      >
        Return to Hub
      </button>
    </div>
  );
}

