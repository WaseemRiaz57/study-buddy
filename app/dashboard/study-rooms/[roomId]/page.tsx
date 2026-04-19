"use client";

import { useState, useEffect, use } from "react";
// ✨ Added missing import for animations
import { motion, AnimatePresence } from "framer-motion"; 
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import type { LiveVideoRoomRenderState } from "@/components/LiveVideoRoom";
import { LocalVideoTrack, RemoteUser } from "agora-rtc-react";
import {
  Mic,
  Video,
  MonitorUp,
  PhoneOff,
  Send,
  FolderOpen,
  MessageSquare,
  Clock,
  VideoOff,
  MicOff
} from "lucide-react";

const LiveVideoRoom = dynamic(() => import("@/components/LiveVideoRoom"), {
  ssr: false,
  loading: () => <p>Starting Camera...</p>,
});

export default function StudyRoomSessionPage({ params }: { params: Promise<{ roomId: string }> }) {
  // Unwrap params
  const { roomId } = use(params);
  const { data: session } = useSession();

  const currentUserName = session?.user?.name || "You";
  const sessionUserId = String(
    (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.email ||
      session?.user?.name ||
      "guest-user"
  );

  const [activeTab, setActiveTab] = useState<"chat" | "vault">("chat");
  const [showChat, setShowChat] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <LiveVideoRoom
      roomId={roomId}
      userId={sessionUserId}
      renderAction={(liveRoom: LiveVideoRoomRenderState) => (
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col font-sans transition-colors duration-300
          bg-slate-50 text-slate-900 
          dark:bg-[#0f0c1d] dark:text-white">
      
      {/* ── Background Ambience (Dark Only) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8c30e8]/5 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Bar ── */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b backdrop-blur-md transition-colors
        bg-white/80 border-slate-200
        dark:bg-[#0f0a16]/80 dark:border-white/5">
        
        {/* Left: Room Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-colors
              bg-purple-100 text-purple-600
              dark:bg-gradient-to-br dark:from-[#8c30e8] dark:to-purple-600 dark:text-white">
              SB
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Study Room {roomId}
                <span className="px-1.5 py-0.5 rounded text-[10px] border font-mono transition-colors
                  bg-red-50 text-red-500 border-red-200
                  dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">LIVE</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Advanced OS Concepts</p>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2 hidden md:block" />
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono transition-colors
            bg-slate-100 border-slate-200 text-slate-600
            dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
            <Clock size={14} className="text-purple-500" />
            <span>{formatTime(seconds)}</span>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 p-1 rounded-xl border shadow-sm transition-colors
          bg-white border-slate-200
          dark:bg-[#1a1524] dark:border-white/10">
          <button 
            onClick={() => setActiveTab("chat")} 
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'chat' 
              ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
          <button 
            onClick={() => setActiveTab("vault")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'vault' 
              ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            <FolderOpen size={14} /> Vault
          </button>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => void liveRoom.leaveRoom()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2">
            <PhoneOff size={16} /> <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        
        {/* LEFT: Collaboration Canvas */}
        <section className="flex-1 relative flex flex-col transition-colors
          bg-slate-100 dark:bg-[#130d1a]">
          
          {/* Canvas Area (Screen Share) */}
          <div className="flex-1 relative overflow-hidden p-4">
            <div className="w-full h-full rounded-2xl border flex items-center justify-center flex-col gap-4 relative overflow-hidden transition-colors shadow-sm
              bg-white border-slate-200
              dark:bg-black/40 dark:border-white/10 dark:shadow-none">
              
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/20">LIVE</span>
                <div className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-colors
                  bg-slate-100 text-slate-900 border border-slate-200
                  dark:bg-black/60 dark:text-white dark:border-white/10">
                  {liveRoom.isScreenSharing
                    ? "You are sharing your screen"
                    : liveRoom.remoteScreenUser
                    ? `Participant ${String(liveRoom.remoteScreenUser.uid)} is sharing`
                    : "No active screen share"}
                </div>
              </div>
              
              <div className="h-[90%] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#110d1b]">
                <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 dark:border-white/10">
                  {(liveRoom.isScreenSharing && liveRoom.screenTrack) || liveRoom.remoteScreenUser ? (
                    liveRoom.isScreenSharing && liveRoom.screenTrack ? (
                     <LocalVideoTrack track={liveRoom.screenTrack as any} play className="h-full w-full object-cover" />
                    ) : (
                      <RemoteUser user={liveRoom.remoteScreenUser as any} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-200">
                      Welcome to Study Room
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video Strip */}
          <div className="h-48 flex gap-4 overflow-x-auto pb-4 px-4">
            <div
              className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all
                bg-white border-slate-200
                dark:bg-zinc-800 dark:border-white/10 ring-2 ring-purple-500 dark:shadow-[0_0_0_2px_#ffd700]"
            >
              {liveRoom.localCameraTrack ? (
                <LocalVideoTrack track={liveRoom.localCameraTrack as any} play className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-200">
                  Camera unavailable
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md transition-colors
                bg-white/80 text-slate-900 font-bold
                dark:bg-black/50 dark:text-white dark:font-normal">
                {currentUserName}
              </div>
            </div>

            {liveRoom.remoteUsers.map((user) => (
              <div
                key={String(user.uid)}
                className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all
                  bg-white border-slate-200
                  dark:bg-zinc-800 dark:border-white/10"
              >
                <RemoteUser user={user as any} className="h-full w-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs backdrop-blur-md transition-colors
                  bg-white/80 text-slate-900 font-bold
                  dark:bg-black/50 dark:text-white dark:font-normal">
                  User {String(user.uid)}
                </div>
              </div>
            ))}

            {liveRoom.remoteUsers.length === 0 ? (
              <div className="aspect-video h-full rounded-xl relative overflow-hidden flex-shrink-0 border shadow-sm transition-all bg-slate-100 border-dashed border-slate-300 text-slate-500 flex items-center justify-center text-xs">
                Waiting for participants...
              </div>
            ) : null}
          </div>

          {/* Bottom Floating Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors
              bg-white/90 border-slate-200
              dark:bg-[#191121]/90 dark:border-white/10">
              
              <ControlBtn isActive={liveRoom.isMicEnabled} onClick={liveRoom.toggleMic} iconOn={Mic} iconOff={MicOff} />
              <ControlBtn isActive={liveRoom.isCameraEnabled} onClick={liveRoom.toggleCamera} iconOn={Video} iconOff={VideoOff} />
              
              <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2" />
              
              <button onClick={liveRoom.toggleScreenShare} className="flex flex-col items-center gap-1 group px-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110
                  bg-purple-600 text-white
                  dark:bg-[#8c30e8]">
                  <MonitorUp size={18} />
                </div>
                <span className="text-[10px] font-medium text-purple-600 dark:text-[#8c30e8]">
                  {liveRoom.isScreenSharing ? "Sharing" : "Share"}
                </span>
              </button>

              <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2" />
              
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-xl transition-all ${
                  showChat 
                  ? 'bg-purple-100 text-purple-600 dark:bg-[#8c30e8] dark:text-white' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10'}`}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Sidebar (Video + Chat) */}
        <AnimatePresence>
          {showChat && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col shadow-xl z-20 border-l transition-colors
                bg-white border-slate-200
                dark:bg-[#0f0a16] dark:border-white/5"
            >
              {/* Chat Container */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 border-b flex justify-between items-center transition-colors
                  bg-white border-slate-100
                  dark:bg-[#130d1a]/50 dark:border-white/5">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Room Chat</h3>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* System Msg */}
                  <div className="flex justify-center">
                    <span className="text-[10px] px-2 py-1 rounded-full transition-colors
                      bg-slate-100 text-slate-500
                      dark:bg-white/5 dark:text-gray-500">Session Started</span>
                  </div>

                  {/* Peer Msg */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-xs font-bold dark:bg-white/10 dark:text-gray-200">P</div>
                     <div className="rounded-2xl rounded-tl-none p-3 text-sm max-w-[85%] border shadow-sm transition-colors
                       bg-white text-slate-700 border-slate-100
                       dark:bg-[#1f192b] dark:text-gray-200 dark:border-white/5">
                        <p>I uploaded the PDF.</p>
                     </div>
                  </div>

                  {/* Me Msg */}
                  <div className="flex flex-row-reverse gap-3">
                     <div className="rounded-2xl rounded-tr-none p-3 text-sm text-white max-w-[85%] shadow-md transition-colors
                       bg-purple-600 dark:bg-[#8c30e8]">
                        <p>Got it, thanks!</p>
                     </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t transition-colors
                  bg-white border-slate-100
                  dark:bg-[#130d1a] dark:border-white/5">
                  <div className="relative flex items-center gap-2 rounded-full px-2 py-1 pr-1 border transition-colors
                    bg-slate-50 border-slate-200
                    dark:bg-[#1a1524] dark:border-white/10">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-2.5 pl-3 transition-colors
                        text-slate-900 placeholder-slate-400
                        dark:text-white dark:placeholder-gray-600"
                    />
                    <button className="p-2 rounded-full text-white transition-colors bg-purple-600 hover:bg-purple-700 dark:bg-[#8c30e8]">
                        <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
      {liveRoom.tokenError ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {liveRoom.tokenError}
        </div>
      ) : null}
    </div>
      )}
    />
  );
}

// Button Component
function ControlBtn({ isActive, onClick, iconOn: IconOn, iconOff: IconOff }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white' 
          : 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
      }`}
    >
      {isActive ? <IconOn size={20} /> : <IconOff size={20} />}
    </button>
  );
}