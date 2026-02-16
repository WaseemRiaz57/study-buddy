"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ActivePeersView from "@/components/study-buddy/ActivePeersView";
import TopicSelectionView from "@/components/study-buddy/TopicSelectionView";
import MatchingLoader from "@/components/study-buddy/MatchingLoader";
import MatchSuccess from "@/components/study-buddy/MatchSuccess";

type ViewState = "dashboard" | "topic" | "loading" | "success";

export default function StudyBuddyPage() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [searchData, setSearchData] = useState({ subject: "", topic: "" });
  
  // New State: Track Loading Mode ('search' or 'direct')
  const [loadingMode, setLoadingMode] = useState<"search" | "direct">("search");

  const [matchedPeerData, setMatchedPeerData] = useState({
    name: "",
    image: "",
    tags: [] as string[]
  });

  // 1. "Add New" -> Search Mode
  const handleAddNew = () => {
    setLoadingMode("search"); // Set mode to Search
    setView("topic");
  };

  // 2. "Connect" Profile -> Direct Mode
  const handleDirectConnect = (peer: any) => {
    setMatchedPeerData({
      name: peer.name,
      image: peer.image,
      tags: peer.subjects
    });
    setLoadingMode("direct"); // Set mode to Direct
    setView("loading"); 
  };

  // 3. Search Submit
  const handleSearch = (data: { subject: string; topic: string }) => {
    setSearchData(data);
    // Note: loadingMode is already 'search' from handleAddNew
    setView("loading");
  };

  // 4. Animation Finished
  const handleMatchFound = () => {
    if (!matchedPeerData.name) {
      setMatchedPeerData({
        name: "Sarah Jenkins",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        tags: [searchData.subject, searchData.topic]
      });
    }
    setView("success");
  };

  const handleClose = () => {
    setView("dashboard");
    setSearchData({ subject: "", topic: "" });
    setMatchedPeerData({ name: "", image: "", tags: [] });
  };

  const handleCancelLoading = () => setView("dashboard");

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0f0a16] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-100 transition-opacity">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full h-full pt-6">
        <AnimatePresence mode="wait">
          
          {view === "dashboard" && (
            <motion.div 
              key="dashboard"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="w-full"
            >
              <ActivePeersView 
                onAddNew={handleAddNew} 
                onConnect={handleDirectConnect} 
              />
            </motion.div>
          )}

          {view === "topic" && (
            <motion.div 
              key="topic"
              className="w-full"
            >
              <TopicSelectionView 
                onSearch={handleSearch} 
                onBack={() => setView("dashboard")} 
              />
            </motion.div>
          )}

          {view === "loading" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-white/90 dark:bg-[#0f0a16]/95 backdrop-blur-md"
            >
              {/* ✨ UPDATED LOADER WITH PROPS */}
              <MatchingLoader 
                onCancel={handleCancelLoading} 
                onMatchFound={handleMatchFound} 
                mode={loadingMode} // 'search' or 'direct'
                peerName={matchedPeerData.name} // "Connecting to Sarah..."
              />
            </motion.div>
          )}

          {view === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="fixed inset-0 z-50 bg-white/90 dark:bg-[#0f0a16]/95 backdrop-blur-md"
            >
              <MatchSuccess 
                onClose={handleClose} 
                matchData={matchedPeerData} 
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}