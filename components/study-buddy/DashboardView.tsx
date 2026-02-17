"use client";

import { motion } from "framer-motion"; // Animation Library
import { Users, Video, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

interface DashboardViewProps {
  onStartMatching: () => void;
}

// Animation Variants (Stagger Effect)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Har item 0.15s ke baad ayega
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } },
};

export default function DashboardView({ onStartMatching }: DashboardViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 font-sans">
      
      {/* Header Section (Animated) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 md:mb-16 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-sm text-purple-700 dark:text-purple-300 mb-4 backdrop-blur-md shadow-sm">
          <Sparkles size={14} />
          <span>New: AI Matchmaking is live</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8c30e8] to-[#e830d5]">Study Circle</span>
        </h1>
        
        <p className="text-slate-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Connect with peers who match your learning style. Join live study rooms or discuss complex topics with the community.
        </p>
      </motion.div>

      {/* Cards Grid (Staggered Animation) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl relative z-10"
      >
        
        {/* Card 1: Find a Buddy (Primary) */}
        <motion.div variants={itemVariants} className="group relative bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {/* Light Mode Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 w-20 h-20 bg-purple-100 dark:bg-[#8c30e8]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Users size={40} className="text-[#8c30e8]" />
          </div>
          
          <h3 className="relative z-10 text-2xl font-bold text-slate-900 dark:text-white mb-3">Find a Buddy</h3>
          <p className="relative z-10 text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
            Match with students based on your specific subject and goals instantly.
          </p>
          
          <button 
            onClick={onStartMatching}
            className="relative z-10 w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#8c30e8] to-[#e830d5] hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
          >
            Start Matching <ArrowRight size={20} />
          </button>
        </motion.div>

        {/* Card 2: Study Room */}
        <motion.div variants={itemVariants} className="group relative bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <div className="relative z-10 w-20 h-20 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Video size={40} className="text-blue-600 dark:text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Video Sessions</h3>
          <p className="text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
            Join active video study rooms and collaborate in real-time with whiteboard.
          </p>
          <button className="relative z-10 w-full py-4 rounded-xl font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Join Session
          </button>
        </motion.div>

        {/* Card 3: Community */}
        <motion.div variants={itemVariants} className="group relative bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <div className="relative z-10 w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare size={40} className="text-green-600 dark:text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Community</h3>
          <p className="text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
            Discuss topics, ask questions, and share notes with the global community.
          </p>
          <button className="relative z-10 w-full py-4 rounded-xl font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Open Chat
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}