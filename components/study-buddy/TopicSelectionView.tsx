"use client";

import { useState } from "react";
import { motion } from "framer-motion"; // Added Animation
import { ArrowLeft, Code, Calculator, Atom, Briefcase, BrainCircuit, BookOpen, Search } from "lucide-react";

interface TopicSelectionViewProps {
  onSearch: (data: { subject: string; topic: string }) => void;
  onBack: () => void;
}

const SUBJECTS = [
  { id: "cs", label: "Computer Science", icon: Code },
  { id: "math", label: "Mathematics", icon: Calculator },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "psych", label: "Psychology", icon: BrainCircuit },
  { id: "other", label: "Other", icon: BookOpen },
];

export default function TopicSelectionView({ onSearch, onBack }: TopicSelectionViewProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSearch = () => {
    if (selectedSubject && topic.trim().length > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        onSearch({ subject: selectedSubject, topic });
      }, 300);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 font-sans relative"
    >
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-0 left-4 md:left-8 flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
      >
        <ArrowLeft size={20} /> 
        <span className="font-medium">Back to Dashboard</span>
      </button>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">Customize your Session</h2>
          <p className="text-slate-500 dark:text-gray-400 text-center mb-8">Choose a subject area and enter your specific topic.</p>

          {/* 1. Subject Grid */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 uppercase tracking-wider pl-1">
              1. Select Subject
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUBJECTS.map((sub, index) => {
                const Icon = sub.icon;
                const isSelected = selectedSubject === sub.label;
                return (
                  <motion.button
                    key={sub.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedSubject(sub.label)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group ${
                      isSelected 
                        ? "bg-[#8c30e8] border-[#8c30e8] text-white shadow-lg shadow-purple-500/20 scale-[1.02]" 
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={24} className={`mb-2 ${isSelected ? "text-white" : "text-slate-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
                    <span className="text-sm font-medium">{sub.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 2. Topic Input */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 uppercase tracking-wider pl-1">
              2. Specific Topic
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. React Hooks, Organic Chemistry, Linear Algebra..."
                className="w-full bg-slate-50 dark:bg-[#0f0a16] border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 pl-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#8c30e8] focus:ring-1 focus:ring-[#8c30e8] transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
            </div>
          </motion.div>

          {/* Action Button */}
          <button
            onClick={handleSearch}
            disabled={!selectedSubject || !topic.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              selectedSubject && topic.trim()
                ? "bg-gradient-to-r from-[#8c30e8] to-[#e830d5] text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-200 dark:border-white/5"
            }`}
          >
            {isAnimating ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Find Study Partner"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}