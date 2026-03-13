"use client";

import { motion } from "framer-motion";
import { Users, Plus, Sparkles, Loader2 } from "lucide-react";

interface Student {
  id?: string;
  userId?: string;
  name: string;
  major?: string;
  university?: string;
  image?: string;
  isOnline: boolean;
  subjects?: string[];
  tags?: string[];
}

interface ActivePeersViewProps {
  onAddNewAction: () => void;
  onConnectAction: (peer: Student) => void;
  peers?: Student[];
  loading?: boolean;
}

export default function ActivePeersView({ onAddNewAction, onConnectAction, peers, loading }: ActivePeersViewProps) {
  // Use API peers if provided, otherwise fall back to empty array
  const displayPeers = peers ?? [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      
      {/* Header & Add New Button */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-[#8c30e8]" /> Study Buddy
          </h1>
          <p className="text-slate-500 dark:text-gray-400">
            Connect with peers currently online.
          </p>
        </div>

        {/* Add New (Start Matching) Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddNewAction}
          className="flex items-center gap-2 bg-gradient-to-r from-[#8c30e8] to-[#e830d5] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
        >
          <Plus size={20} />
          Find New Buddy
        </motion.button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#8c30e8]" />
        </div>
      )}

      {/* Empty State */}
      {!loading && displayPeers.length === 0 && (
        <div className="text-center py-20 text-slate-500 dark:text-gray-400">
          <p className="text-lg font-medium">No peers online right now.</p>
          <p className="text-sm mt-1">Click &quot;Find New Buddy&quot; to start matchmaking!</p>
        </div>
      )}

      {/* Peers Grid */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayPeers.map((peer, index) => {
          const peerId = peer.userId ?? peer.id ?? index.toString();
          const peerSubjects = peer.subjects ?? peer.tags ?? [];
          return (
          <motion.div
            key={peerId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white dark:bg-[#1a1524] border border-slate-200 dark:border-white/10 p-5 rounded-2xl hover:border-[#8c30e8]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
            onClick={() => onConnectAction({ ...peer, subjects: peerSubjects })}
          >
            {/* Online Indicator */}
            {peer.isOnline && (
              <span className="absolute top-5 right-5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1a1524] rounded-full" />
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 dark:border-white/10">
                <img src={peer.image || "/placeholder-avatar.png"} alt={peer.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#8c30e8] transition-colors">
                  {peer.name}
                </h3>
                {peer.major && <p className="text-xs text-slate-500 dark:text-gray-400">{peer.major}</p>}
                {peer.university && <p className="text-xs text-slate-400 dark:text-gray-500">{peer.university}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {peerSubjects.map(sub => (
                <span key={sub} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5">
                  {sub}
                </span>
              ))}
            </div>

            <div className="w-full py-2 rounded-lg border border-slate-200 dark:border-white/10 text-center text-sm font-semibold text-slate-600 dark:text-gray-300 group-hover:bg-[#8c30e8] group-hover:text-white group-hover:border-[#8c30e8] transition-all">
              Connect
            </div>
          </motion.div>
          );
        })}

        {/* Placeholder Card for "Add New" visual */}
        <motion.div
          onClick={onAddNewAction}
          whileHover={{ scale: 1.02 }}
          className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#8c30e8] hover:bg-slate-50 dark:hover:bg-white/5 transition-all min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400 dark:text-gray-500 group-hover:text-[#8c30e8]">
            <Sparkles size={24} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Discover More</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Match with new students</p>
        </motion.div>

      </div>
      )}
    </div>
  );
}