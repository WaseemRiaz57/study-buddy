"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Clock3, Radio, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import PublicProfileModal from "@/components/PublicProfileModal";
import CreateRoomModal from "@/components/study-room/CreateRoomModal";
import { useGamificationStore } from "@/store/useGamificationStore";
import StudyRoomsLoading from "@/app/study-rooms/loading";

type Room = {
  _id: string;
  topic: string;
  roomId: string;
  participantsCount: number;
  capacity: number;
  hostName: string;
  hostId: string;
  hostImage: string;
  isLive: boolean;
  isActive: boolean;
  status: string;
};

export default function StudyRoomsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [publicProfileUserId, setPublicProfileUserId] = useState<string | null>(null);
  const router = useRouter();
  const addReward = useGamificationStore((state) => state.addReward);

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    setRoomsError("");

    try {
      const response = await fetch("/api/study-rooms", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setRoomsError(payload?.message || "Failed to load rooms.");
        return;
      }

      const rawRooms = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      const normalizedRooms: Room[] = rawRooms.map((room: any) => ({
            _id: String(room._id),
            topic: String(room.title || room.topic || "Untitled Room"),
            roomId: String(room.roomId || ""),
            participantsCount:
              typeof room.participantsCount === "number"
                ? room.participantsCount
                : typeof room.participantCount === "number"
                  ? room.participantCount
                : Array.isArray(room.participants)
                  ? room.participants.length
                  : 0,
            capacity: typeof room.maxParticipants === "number" ? room.maxParticipants : 20,
            hostName: String(room?.createdBy?.name || "Unknown Host"),
            hostId: String(room?.createdBy?._id || ""),
            hostImage: String(room?.createdBy?.profileImage || room?.createdBy?.image || ""),
            isLive: Boolean(room?.isActive === true || room?.status === "active" || room?.isLive === true),
            isActive: room?.isActive === true,
            status: String(room?.status || ""),
          })).filter((room: Room) => room.participantsCount > 0);

      setRooms(normalizedRooms);
    } catch (error) {
      console.log("Fetch Error:", error);
      setRoomsError("Failed to load rooms.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const activeRooms = rooms.filter(
    (room) => room.isActive === true || room.status === "active"
  );

  if (isLoadingRooms && rooms.length === 0 && !roomsError) {
    return <StudyRoomsLoading />;
  }

  const handleJoinWithCode = async () => {
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode) return;

    setIsJoining(true);
    setJoinError("");

    try {
      const response = await fetch(`/api/study-rooms/${normalizedCode}/join`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setJoinError(data?.message || "Failed to join room.");
        return;
      }

      addReward(20, 0);
      router.push(`/dashboard/study-rooms/${normalizedCode}`);
    } catch {
      setJoinError("Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <main className="relative z-10 flex-1 px-4 md:px-8 py-8 pb-20 bg-slate-50 dark:bg-[#0f0c13] min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* Background Decoration */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-0 dark:opacity-100 transition-opacity">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8c30e8]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4fd1c5]/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl flex flex-col gap-8 relative z-10">
          
          {/* ── HEADER SECTION (Updated) ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-[#7C3AED]">
                  Study Groups
                </span>
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-lg font-light">
                Connect with peers, find your focus flow.
              </p>
            </div>

            {/* ✨ NEW BUTTON POSITION (Like Study with Buddy) */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED] font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <Plus size={20} />
              Create New Room
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full h-12 rounded-xl pl-12 pr-4 transition-all
                  bg-white border border-slate-200 text-slate-900 placeholder-slate-400
                  dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/30
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Search for a topic..."
                type="text"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Enter Room ID"
                  className="px-4 h-12 rounded-xl text-sm font-medium transition-all w-36
                    bg-white border border-slate-200 text-slate-700 placeholder-slate-400
                    dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/30
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={!joinCode.trim() || isJoining}
                  className="px-4 h-12 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-all
                    bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
                    dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  {isJoining ? "Joining..." : "Join"}
                </button>
              </div>
              <button className="px-4 h-12 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all
                bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:border-[#4fd1c5]/30">
                <SlidersHorizontal size={16} />
                Subject
              </button>
              <button className="px-4 h-12 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all
                bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:border-[#4fd1c5]/30">
                <Clock3 size={16} />
                Duration
              </button>
            </div>
          </div>
          {joinError ? <p className="text-sm text-red-500">{joinError}</p> : null}

          {/* ── ROOM GRID (Cleaned) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {!isLoadingRooms && roomsError ? (
              <div className="col-span-full rounded-2xl p-6 text-center border border-slate-200 bg-white text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
                <p className="text-sm text-red-500 font-medium">Unable to load rooms right now. Please try again.</p>
                <button
                  onClick={loadRooms}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    bg-slate-900 text-white hover:bg-slate-800
                    dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Retry
                </button>
              </div>
            ) : null}
            
            {/* Note: Removed the "Create Card" from here */}

            {/* Room Cards */}
            {!isLoadingRooms && !roomsError && activeRooms.length === 0 ? (
              <div className="col-span-full rounded-2xl p-6 text-center border border-slate-200 bg-white text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-300">
                No live public rooms right now.
              </div>
            ) : null}

            {activeRooms.map((room) => (
              <article
                key={room._id}
                onClick={() => router.push(`/dashboard/study-rooms/${room.roomId}`)}
                className="group cursor-pointer relative flex flex-col p-5 h-64 rounded-2xl transition-all duration-300 hover:-translate-y-1
                  bg-white border border-slate-200 shadow-sm hover:shadow-md
                  dark:bg-white/5 dark:border-white/10 dark:hover:border-[#4fd1c5]/30 dark:shadow-none backdrop-blur-md"
              >
                {/* Live Badge */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${room.isLive ? "bg-teal-500 dark:bg-[#4fd1c5] animate-pulse" : "bg-slate-400 dark:bg-gray-500"}`} />
                    <span className={`text-xs font-bold tracking-wide uppercase inline-flex items-center gap-1 ${room.isLive ? "text-teal-600 dark:text-[#4fd1c5]" : "text-slate-500 dark:text-gray-400"}`}>
                      <Radio size={12} />
                      {room.isLive ? "Live" : "Ended"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{room.topic}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 rounded-md text-xs font-medium
                      bg-slate-100 text-slate-600 border border-slate-200
                      dark:bg-white/5 dark:text-white/70 dark:border-white/10">
                      {room.roomId}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500 dark:text-gray-300 truncate pr-3">
                    Host:{" "}
                    {room.hostId ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPublicProfileUserId(room.hostId);
                        }}
                        className="inline-flex max-w-[120px] items-center gap-1.5 truncate align-middle font-semibold text-[#7C3AED] hover:underline"
                      >
                        {room.hostImage && (
                          <img
                            src={room.hostImage}
                            alt={`${room.hostName} profile picture`}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        <span className="truncate">{room.hostName}</span>
                      </button>
                    ) : (
                      <span className="text-slate-700 dark:text-white">{room.hostName}</span>
                    )}
                  </div>
                  <div className="text-slate-500 dark:text-white/60 text-sm font-medium flex items-center gap-1">
                    <Users size={14} />
                    {room.participantsCount}/{room.capacity}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <CreateRoomModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={loadRooms} />
      <PublicProfileModal
        userId={publicProfileUserId}
        onClose={() => setPublicProfileUserId(null)}
      />
    </>
  );
}

