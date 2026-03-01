"use client";

import { useState } from "react"; // <-- IMPORT ADDED
import { motion } from "framer-motion";
import { 
  BookOpen, TrendingUp, Clock, Users, DollarSign, 
  Award, Calendar, FileText, CheckCircle, XCircle, 
  BarChart3, Wallet, CreditCard, Star, ArrowRight,
  MessageCircle, Video, Settings, Target, Coins, Plus, Menu
} from "lucide-react";
import RequestApprovalModal from "@/components/modals/RequestApprovalModal"; // <-- MODAL IMPORT ADDED

// 👇 DYNAMIC DATA OBJECT (Ready for Backend Integration)
// 👇 DYNAMIC DATA OBJECT (Updated with Modal Details)
const MENTOR_DATA = {
  profile: {
    name: "Mentor Elias",
    role: "Senior Mentor",
    initials: "ME",
    xp: 8450,
    maxXp: 10000,
    gold: 1200,
    rating: 4.9,
    totalStudents: 120,
    sessionHours: 450,
    studentGrowth: 12,
    hoursGrowth: 5,
  },
  earnings: {
    week: 420.00,
    balance: 1200,
    fees: 42.00,
    nextPayout: "Friday, Oct 27"
  },
  requests: [
    { 
      id: 1, 
      name: "Alex J.", 
      subject: "Advanced Calculus", 
      tags: ["Exam Prep", "60 mins"], 
      time: "15m ago", 
      initials: "AJ",
      // 👇 Modal ke liye naya data
      tagline: "Seeking wisdom to unravel the mysteries of the vector space.",
      focusScore: 88,
      subjects: [
        { subject: "Calculus II", grade: "A-", progress: 92 },
        { subject: "Physics", grade: "B+", progress: 85 }
      ],
      personalMessage: "I am struggling with Linear Algebra concepts, specifically eigenvalues, and I need your guidance to reach the Sage rank. Your approach to abstract concepts really resonates with my learning style."
    },
    { 
      id: 2, 
      name: "Sarah K.", 
      subject: "UI Design Principles", 
      tags: ["Project Review", "45 mins"], 
      time: "1h ago", 
      initials: "SK",
      // 👇 Modal ke liye naya data
      tagline: "Aspiring designer looking for pixel-perfect guidance.",
      focusScore: 94,
      subjects: [
        { subject: "UI/UX Design", grade: "A", progress: 96 },
        { subject: "Web Development", grade: "A-", progress: 88 }
      ],
      personalMessage: "Could you review my latest Figma prototype? I want to make sure the user flow makes sense before I start coding."
    },
    { 
      id: 3, 
      name: "Marcus T.", 
      subject: "Python Fundamentals", 
      tags: ["Debug Help", "30 mins"], 
      time: "3h ago", 
      initials: "MT",
      // 👇 Modal ke liye naya data
      tagline: "Debugging my way through life.",
      focusScore: 76,
      subjects: [
        { subject: "Python", grade: "C+", progress: 65 },
        { subject: "Data Structures", grade: "B-", progress: 72 }
      ],
      personalMessage: "I keep getting a RecursionError in my binary tree traversal. Can we hop on a quick call to go over it?"
    },
  ]
};

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export function MentorDashboard() {
  const { profile, earnings, requests } = MENTOR_DATA;
  
  // 👇 MODAL STATE ADDED
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // 👇 FUNCTION TO HANDLE CLICK
  const handleOpenRequest = (request: any) => {
    setSelectedRequest(request);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">Welcome back, {profile.name}</h2>
              <p className="text-muted-foreground">You have {requests.length} new session requests and a payout ready.</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">Local Time</p>
              <p className="text-lg font-medium text-foreground">10:42 AM, Oct 24</p>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div {...fadeIn} className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
              <p className="text-sm text-muted-foreground mb-2">Total Students Taught</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-blue-500">{profile.totalStudents}+</span>
                <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={14} /> {profile.studentGrowth}%
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
              <p className="text-sm text-muted-foreground mb-2">Session Hours</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-purple-500">{profile.sessionHours}</span>
                <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={14} /> {profile.hoursGrowth}%
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
              <p className="text-sm text-muted-foreground mb-2">Mentor Rating</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-yellow-500">{profile.rating}<span className="text-2xl text-muted-foreground/50 font-light">/5</span></span>
                <div className="flex text-yellow-500">
                  {[1,2,3,4].map((i) => <Star key={i} size={16} fill="currentColor" />)}
                  <Star size={16} fill="currentColor" className="opacity-50" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: Session Requests */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                Session Requests
              </h3>
              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full">{requests.length} NEW</span>
            </div>

            {/* Request Cards */}
            <div className="space-y-4">
              {requests.map((request, i) => (
                <motion.div 
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-panel p-5 rounded-2xl hover:border-primary/30 transition-all cursor-pointer" // <-- ADDED CURSOR
                  onClick={() => handleOpenRequest(request)} // <-- ADDED ONCLICK
                >
                  <div className="flex items-start gap-4 mb-4 pointer-events-none"> {/* <-- ADDED POINTER EVENTS NONE */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {request.initials}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{request.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{request.subject}</p>
                      <div className="flex gap-2">
                        {request.tags.map((tag, j) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 bg-muted rounded font-bold uppercase text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{request.time}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    {/* Buttons trigger the same modal for now for smooth UX */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenRequest(request); }} 
                      className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenRequest(request); }}
                      className="px-4 py-2.5 bg-muted text-muted-foreground text-sm font-bold rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* MIDDLE: Performance Chart */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={20} />
                Performance
              </h3>
              <select className="bg-transparent border-none text-xs font-bold text-muted-foreground focus:ring-0 cursor-pointer">
                <option>This Week</option>
                <option>Last Month</option>
              </select>
            </div>

            <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="glass-panel p-6 rounded-2xl min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Student Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    88.4% <span className="text-xs font-medium text-emerald-500 ml-1">+2.1%</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                    <span className="text-xs font-medium text-muted-foreground">Avg.</span>
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-1 relative flex items-end pb-6">
                <div className="absolute inset-0 flex flex-col justify-between py-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-full border-t border-border/30"></div>
                  ))}
                </div>
                
                {/* SVG Chart */}
                <div className="w-full h-full relative z-10">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" className="text-blue-500" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" className="text-blue-500" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 Q20,70 40,75 T80,40 T100,50 L100,100 L0,100 Z" fill="url(#chartGradient)" />
                    <path d="M0,80 Q20,70 40,75 T80,40 T100,50" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Day Labels */}
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Earnings & Actions */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wallet className="text-blue-500" size={20} />
                Earnings
              </h3>
            </div>

            <motion.div {...fadeIn} transition={{ delay: 0.5 }} className="glass-panel p-6 rounded-2xl">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Earned this week</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">${earnings.week.toFixed(2)}</span>
                  <span className="text-sm font-medium text-muted-foreground">USD</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm pb-4 border-b border-border/50">
                  <span className="text-muted-foreground">Next Payout</span>
                  <span className="font-bold text-foreground">{earnings.nextPayout}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-4 border-b border-border/50">
                  <span className="text-muted-foreground">Gold Balance</span>
                  <div className="flex items-center gap-1 font-bold text-yellow-600 dark:text-yellow-400">
                    <Coins size={14} /> {earnings.balance.toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Platform Fees</span>
                  <span className="font-bold text-muted-foreground">-${earnings.fees.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <CreditCard size={18} />
                Request Payout
              </button>
              
              <p className="text-center text-[10px] text-muted-foreground mt-3">Funds usually arrive in 1-3 business days.</p>
            </motion.div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 glass-panel p-4 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                  <Calendar className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-xs font-bold text-foreground">Reschedule</span>
                </button>
                <button className="flex flex-col items-center gap-2 glass-panel p-4 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                  <FileText className="text-purple-500 group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-xs font-bold text-foreground">Create Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
              <BookOpen className="text-primary" size={14} />
            </div>
            <span className="font-bold text-muted-foreground text-sm">StudyBuddy Mentor Network</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 StudyBuddy Education Inc. All sessions are monitored for quality assurance.</p>
        </div>
      </footer>

      {/* 👇 MODAL RENDERED HERE */}
      {selectedRequest && (
        <RequestApprovalModal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          studentData={selectedRequest} 
        />
      )}

    </div>
  );
}