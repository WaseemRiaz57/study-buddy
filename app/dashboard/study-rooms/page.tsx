"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Clock3, Radio, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
            isLive: Boolean(
              room?.isLive === true &&
                room?.isActive === true &&
                room?.status === "active"
            ),
            isActive: room?.isActive === true,
            status: String(room?.status || ""),
          })).filter(
            (room: Room) =>
              room.isLive &&
              room.isActive &&
              room.status === "active" &&
              room.participantsCount > 0
          );

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
    (room) =>
      room.isLive === true &&
      room.isActive === true &&
      room.status === "active" &&
      room.participantsCount > 0
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

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5">
          
          {/* ── HEADER SECTION (Updated) ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                <span className="text-[#7C3AED]">
                  Study Groups
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 md:text-base">
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
          <section aria-label="Live study rooms" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

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
                className="group relative flex min-h-[288px] flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5
                  bg-white border border-slate-200 shadow-sm hover:border-[#7C3AED]/25 hover:shadow-md
                  dark:bg-white/5 dark:border-white/10 dark:hover:border-[#4fd1c5]/30 dark:shadow-none backdrop-blur-md"
              >
                <Link
                  href={`/dashboard/study-rooms/${room.roomId}`}
                  aria-label={`Join ${room.topic}`}
                  className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60"
                >
                  <span className="sr-only">Join {room.topic}</span>
                </Link>

                {/* Visual cover */}
                <div className="relative h-32 shrink-0 overflow-hidden bg-gradient-to-br from-violet-600 via-[#7C3AED] to-indigo-950 dark:from-violet-800 dark:via-purple-950 dark:to-slate-950">
                  <div aria-hidden="true" className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:24px_24px]" />
                  <div aria-hidden="true" className="absolute -bottom-14 -right-8 h-36 w-36 rounded-full border-[24px] border-white/10" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
                    <span className={`h-2 w-2 rounded-full ${room.isLive ? "animate-pulse bg-teal-300" : "bg-slate-400"}`} />
                    <Radio size={11} aria-hidden="true" />
                    {room.isLive ? "Live" : "Ended"}
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-wider text-white/90 backdrop-blur-md">
                    {room.roomId}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-[#7C3AED] dark:text-white">{room.topic}</h2>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/5">
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
                        className="relative z-20 inline-flex max-w-[120px] items-center gap-1.5 truncate align-middle font-semibold text-[#7C3AED] hover:underline"
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
                </div>
              </article>
            ))}
          </section>
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

