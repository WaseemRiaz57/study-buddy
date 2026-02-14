"use client";

import { motion } from "framer-motion";
import { Search, Bell, TrendingUp, Clock, FileText, BookOpen, CheckSquare, Plus, Download, MessageCircle, Play } from "lucide-react";

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* TOP HEADER: Welcome & Search */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Welcome, Scholar! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-400 text-sm">Ready to achieve your goals today?</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#1a1625] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary w-64"
            />
          </div>
          <button className="p-2.5 bg-[#1a1625] border border-white/10 rounded-full text-white hover:bg-white/5 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1625]"></span>
          </button>
        </div>
      </header>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: Study Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-gradient-to-br from-[#2a1d3d] to-[#15101d] border border-white/5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-white text-lg">Study Progress</h3>
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Weekly Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-purple-400 h-full w-[75%] rounded-full shadow-[0_0_15px_rgba(140,48,232,0.5)]" />
            </div>
          </div>

          <div className="bg-[#1e192b]/50 p-4 rounded-xl border border-white/5">
            <h4 className="text-3xl font-bold text-white">24.5 hrs</h4>
            <p className="text-sm text-gray-400">Total Study Hours</p>
          </div>
        </motion.div>

        {/* CARD 2: Upcoming Sessions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-[#1a1424]/60 border border-white/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg">Upcoming Sessions</h3>
            <Clock className="text-blue-400" size={18} />
          </div>

          <div className="space-y-3">
            {[
              { name: "Dr. Sarah Johnson", sub: "Mathematics", time: "Today, 3:00 PM", color: "bg-purple-500/10 text-purple-400" },
              { name: "Prof. Mike Chen", sub: "Physics", time: "Tomorrow, 10:00 AM", color: "bg-blue-500/10 text-blue-400" },
              { name: "Dr. Emily Davis", sub: "Chemistry", time: "Wed, 2:00 PM", color: "bg-pink-500/10 text-pink-400" },
            ].map((session, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#231e2e] hover:bg-white/5 transition-colors group">
                <div>
                  <h4 className="font-semibold text-white text-sm">{session.name}</h4>
                  <p className="text-xs text-gray-400">{session.sub} • <span className={session.color}>{session.time}</span></p>
                </div>
                <button className="px-3 py-1.5 text-xs font-bold bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                  JOIN
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CARD 3: AI Generator (The 4 Buttons) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-[#1a1424]/60 border border-white/5"
        >
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg">AI Generator</h3>
            <FileText className="text-pink-400" size={18} />
          </div>

          <div className="grid grid-cols-2 gap-3 h-[200px]">
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-[#2a1d3d] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform"><FileText size={20} /></div>
              <span className="text-xs font-medium text-gray-300">Generate Notes</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-[#2a1d3d] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:scale-110 transition-transform"><BookOpen size={20} /></div>
              <span className="text-xs font-medium text-gray-300">Summarize</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-[#2a1d3d] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform"><CheckSquare size={20} /></div>
              <span className="text-xs font-medium text-gray-300">Quiz Me</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-[#2a1d3d] border border-white/5 hover:border-primary/50 transition-all group">
              <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg group-hover:scale-110 transition-transform"><Plus size={20} /></div>
              <span className="text-xs font-medium text-gray-300">Upload File</span>
            </button>
          </div>
        </motion.div>

        {/* CARD 4: To-Do List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-[#1a1424]/60 border border-white/5"
        >
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">To-Do List</h3>
            <button className="text-primary hover:bg-primary/10 p-1 rounded"><Plus size={18} /></button>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-[#231e2e] rounded-xl border border-white/5">
                <div className="w-5 h-5 border-2 border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-primary"></div>
                <span className="text-sm text-gray-300">Complete Math Assignment Ch. 5</span>
             </div>
             <div className="flex items-center gap-3 p-3 bg-[#231e2e]/50 rounded-xl border border-white/5 opacity-60">
                <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-black font-bold text-xs">✓</div>
                <span className="text-sm text-gray-400 line-through">Review Physics Notes</span>
             </div>
          </div>
        </motion.div>

        {/* CARD 5: Community Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-[#1a1424]/60 border border-white/5"
        >
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">Community Highlights</h3>
            <MessageCircle className="text-cyan-400" size={18} />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-[#231e2e] rounded-xl border border-white/5 cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-1">
                 <h4 className="text-sm font-semibold text-white">Best study techniques for exams?</h4>
                 <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full">🔥 Trending</span>
              </div>
              <p className="text-xs text-gray-400">24 replies • 2 hours ago</p>
            </div>
            <div className="p-3 bg-[#231e2e] rounded-xl border border-white/5 cursor-pointer hover:border-primary/30 transition-colors">
                 <h4 className="text-sm font-semibold text-white">Looking for study group - Calculus</h4>
                 <p className="text-xs text-gray-400">8 replies • 5 hours ago</p>
            </div>
          </div>
        </motion.div>

        {/* CARD 6: Recent Resources */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6 rounded-[1.5rem] bg-[#1a1424]/60 border border-white/5"
        >
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-lg">Recent Resources</h3>
            <BookOpen className="text-purple-400" size={18} />
          </div>
          <div className="space-y-3">
            {[
              { name: "Math Notes - Chapter 5", type: "PDF" },
              { name: "Physics Quiz - Kinematics", type: "Quiz" },
            ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-[#231e2e] rounded-xl border border-white/5 group hover:bg-white/5">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400"><FileText size={16} /></div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{item.name}</h4>
                      <p className="text-[10px] text-gray-500">{item.type} • 2 hours ago</p>
                    </div>
                 </div>
                 <button className="text-gray-500 hover:text-white transition-colors"><Download size={16} /></button>
               </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}