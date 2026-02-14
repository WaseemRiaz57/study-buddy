"use client";

import { motion } from "framer-motion";
import { DollarSign, Users, Calendar, ArrowUpRight } from "lucide-react";

export function MentorDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage your sessions and earnings.</p>
        </div>
        <button className="bg-accent-mint text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
          + Create Session
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Earnings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-3xl border-l-4 border-l-emerald-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-3xl font-bold text-foreground">$1,250</h3>
          <p className="text-sm text-muted-foreground">Total Earnings</p>
        </motion.div>

        {/* Students Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-3xl border-l-4 border-l-blue-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">42</h3>
          <p className="text-sm text-muted-foreground">Active Students</p>
        </motion.div>

        {/* Upcoming Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-3xl border-l-4 border-l-purple-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Calendar size={24} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">3</h3>
          <p className="text-sm text-muted-foreground">Sessions Today</p>
        </motion.div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-panel rounded-3xl p-8">
        <h3 className="text-xl font-bold text-foreground mb-6">Recent Bookings</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/20" />
                <div>
                  <p className="font-bold text-foreground">Student Name</p>
                  <p className="text-xs text-muted-foreground">React JS Consultation</p>
                </div>
              </div>
              <ArrowUpRight className="text-muted-foreground" size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}