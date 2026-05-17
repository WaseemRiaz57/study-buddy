"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
  const [customSubject, setCustomSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const resolvedSubject =
    selectedSubject === "Other" ? customSubject.trim() : selectedSubject;

  const handleSearch = () => {
    if (resolvedSubject) {
      setIsAnimating(true);
      setTimeout(() => {
        onSearch({ subject: resolvedSubject, topic: topic.trim() });
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

      <div className="w-full max-w-2xl bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">Create a study listing</h2>
          <p className="text-slate-500 dark:text-gray-400 text-center mb-8">Choose a subject and add an optional focus topic.</p>

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
                    onClick={() => {
                      setSelectedSubject(sub.label);
                      if (sub.label !== "Other") {
                        setCustomSubject("");
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group ${
                      isSelected 
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20 scale-[1.02]" 
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={24} className={`mb-2 ${isSelected ? "text-white" : "text-slate-400 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
                    <span className="text-sm font-medium">{sub.label}</span>
                  </motion.button>
                );
              })}
            </div>
            {selectedSubject === "Other" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <input
                  type="text"
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  placeholder="Type your subject here..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/15 dark:border-white/10 dark:bg-[#0f0a16] dark:text-white dark:placeholder-gray-600"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 uppercase tracking-wider pl-1">
              2. Focus Topic
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Optional: React Hooks, Organic Chemistry, Linear Algebra..."
                className="w-full bg-slate-50 dark:bg-[#0f0a16] border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 pl-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
            </div>
          </motion.div>

          {/* Action Button */}
          <button
            onClick={handleSearch}
            disabled={!resolvedSubject}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              resolvedSubject
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25 hover:opacity-90"
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

