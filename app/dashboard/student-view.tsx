"use client";

import { motion } from "framer-motion";
import { Search, TrendingUp, Clock, FileText, Plus, Sparkles, Zap, BarChart3, Target, Award, CheckSquare, Upload, Download, MessageCircle, BookOpen, Brain, Timer, Star, Trophy, BookMarked, Lock, ArrowRight, Users } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export function StudentDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Level Progress Card */}
          <motion.div {...fadeIn} className="md:col-span-2 relative overflow-hidden glass-panel rounded-[2rem] p-8 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-20 -mt-20 blur-[80px] group-hover:bg-primary/30 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <span className="inline-block text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-4">
                  Progress Milestone
                </span>
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-foreground tracking-tight">Level 15 is within reach!</h2>
                <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                  You've completed <span className="text-foreground font-bold">85%</span> of your weekly goals. Finish 2 more sessions to ascend to the next tier.
                </p>
                <button className="mt-8 inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
                  <span>Continue Journey</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Circular Progress */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-muted-foreground/10" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="10" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 439.8 }}
                    animate={{ strokeDashoffset: 65.97 }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="text-primary" 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="10"
                    strokeDasharray="439.8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-foreground tracking-tighter">14</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Level</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Session Card */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-panel rounded-[2rem] p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-primary/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="text-primary" size={18} />
                <span className="font-bold text-sm text-primary">Up Next Session</span>
              </div>
              <h3 className="text-xl font-bold text-foreground leading-tight">Deep Work:<br/>Organic Chemistry</h3>
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <Users size={14} /> Join 12 others in Study Room A
              </p>
            </div>

            <div className="mt-6 relative z-10">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-3 tracking-wider">Starts In</p>
              <div className="flex gap-2">
                <div className="bg-background/50 backdrop-blur-md px-3 py-2 rounded-xl border border-border/50 flex-1 text-center">
                  <span className="block text-2xl font-black text-foreground">14</span>
                  <span className="text-[10px] font-bold text-muted-foreground">MIN</span>
                </div>
                <div className="bg-background/50 backdrop-blur-md px-3 py-2 rounded-xl border border-border/50 flex-1 text-center">
                  <span className="block text-2xl font-black text-foreground">02</span>
                  <span className="text-[10px] font-bold text-muted-foreground">SEC</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 2: QUESTS & NOTES */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Daily Quests */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                 Daily Quests <Target className="text-primary" size={20} />
              </h2>
              <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Refresh</button>
            </div>

            <div className="space-y-3">
              {/* Quest 1 - Completed */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Timer className="text-emerald-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Complete 1 Pomodoro</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+50 XP • +10 Coins</p>
                  </div>
                </div>
                <button className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                  Claim
                </button>
              </div>

              {/* Quest 2 - In Progress */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookMarked className="text-purple-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Review AI Flashcards</p>
                    <p className="text-xs text-muted-foreground mt-0.5">15/20 Reviewed</p>
                  </div>
                </div>
                <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold group-hover:bg-primary group-hover:text-white transition-all">
                  Resume
                </button>
              </div>

              {/* Quest 3 - Locked */}
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Users className="text-muted-foreground" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Join a Peer Session</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+100 XP • Reward Case</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                   <Lock size={12} /> Locked
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Notes Carousel - SCROLLBAR HIDDEN */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Recent AI Notes <Sparkles className="text-primary" size={20} />
              </h2>
              <button className="flex items-center gap-1 text-primary text-sm font-bold hover:gap-2 transition-all">
                See All <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[
                { title: "Photosynthesis Deep Dive", subject: "Biology", time: "2m ago", gradient: "from-indigo-500 to-purple-600", icon: Brain },
                { title: "Quantum Mechanics Intro", subject: "Physics", time: "1h ago", gradient: "from-emerald-500 to-teal-600", icon: Zap },
                { title: "Macroeconomics Ch. 4", subject: "Economics", time: "5h ago", gradient: "from-orange-500 to-red-600", icon: TrendingUp },
                { title: "The Industrial Revolution", subject: "History", time: "1d ago", gradient: "from-blue-500 to-cyan-600", icon: BookOpen },
              ].map((note, i) => (
                <div key={i} className="min-w-[260px] glass-panel rounded-[1.5rem] p-5 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden">
                  <div className={`aspect-[4/3] rounded-2xl mb-4 overflow-hidden relative bg-gradient-to-br ${note.gradient} flex items-center justify-center shadow-inner`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <note.icon className="text-white/60 group-hover:scale-110 transition-transform duration-500" size={48} />
                  </div>
                  <h4 className="font-bold text-base mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {note.title}
                  </h4>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {note.subject}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">{note.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}