"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Plus, Sparkles, Trash2, Users } from "lucide-react";

interface Student {
  _id?: string;
  id?: string;
  userId?: string;
  requestStatus?: "pending" | "none";
  name: string;
  major?: string;
  university?: string;
  image?: string;
  isOnline: boolean;
  subjects?: string[];
  tags?: string[];
}

interface StudyBuddyListing {
  _id: string;
  subject: string;
  topic: string;
  status: string;
  createdAt?: string;
  student?: {
    _id: string;
    name: string;
    image: string;
  } | null;
}

interface ActivePeersViewProps {
  onAddNewAction: () => void;
  onConnectAction?: (peer: Student) => void;
  peers?: Student[];
  myListings?: StudyBuddyListing[];
  otherListings?: StudyBuddyListing[];
  loading?: boolean;
  selectedTopic?: string;
  onCancelListing?: (listingId: string) => Promise<void> | void;
  onConnectListing?: (listing: StudyBuddyListing) => Promise<void> | void;
}

function ListingAvatar({ name, image }: { name: string; image?: string }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SB";

  return (
    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100 dark:border-white/10 dark:bg-white/10">
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

export default function ActivePeersView({
  onAddNewAction,
  myListings = [],
  otherListings = [],
  loading,
  onCancelListing,
  onConnectListing,
}: ActivePeersViewProps) {
  const [cancellingListingId, setCancellingListingId] = useState<string | null>(null);
  const [connectingListingId, setConnectingListingId] = useState<string | null>(null);

  const handleCancel = async (listingId: string) => {
    if (!onCancelListing) return;

    setCancellingListingId(listingId);
    try {
      await onCancelListing(listingId);
    } finally {
      setCancellingListingId(null);
    }
  };

  const handleConnect = async (listing: StudyBuddyListing) => {
    if (!onConnectListing) return;

    setConnectingListingId(listing._id);
    try {
      await onConnectListing(listing);
    } finally {
      setConnectingListingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Users className="text-[#8c30e8]" /> Study Buddy
          </h1>
          <p className="text-slate-500 dark:text-gray-400">
            Create listings and connect with peers ready to study.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddNewAction}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8c30e8] to-[#e830d5] px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-purple-500/50"
        >
          <Plus size={20} />
          Create Listing
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#8c30e8]" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  My Active Listings
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Manage the subjects you are currently listed for.
                </p>
              </div>
            </div>

            {myListings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-[#1a1524]/70 dark:text-gray-400">
                You do not have any active listings yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {myListings.map((listing, index) => {
                  const isCancelling = cancellingListingId === listing._id;

                  return (
                    <motion.div
                      key={listing._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1524]"
                    >
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                            Subject
                          </p>
                          <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                            {listing.subject}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                            {listing.topic || "General topic"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCancel(listing._id)}
                        disabled={isCancelling}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                      >
                        {isCancelling ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Cancel Listing
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Looking for Study Partners
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Join a peer who is actively looking for a study partner.
              </p>
            </div>

            {otherListings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500 dark:border-white/10 dark:bg-[#1a1524]/70 dark:text-gray-400">
                <Sparkles className="mx-auto mb-3 h-7 w-7 text-[#8c30e8]" />
                <p className="text-lg font-medium">No open listings right now.</p>
                <p className="mt-1 text-sm">Create a listing and we will show it to other students.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {otherListings.map((listing, index) => {
                  const studentName = listing.student?.name || "Study Buddy";
                  const studentImage = listing.student?.image || "";
                  const isConnecting = connectingListingId === listing._id;

                  return (
                    <motion.div
                      key={listing._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#8c30e8]/50 hover:shadow-md dark:border-white/10 dark:bg-[#1a1524]"
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <ListingAvatar name={studentName} image={studentImage} />
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900 transition-colors group-hover:text-[#8c30e8] dark:text-white">
                            {studentName}
                          </h3>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">
                            Searching now
                          </p>
                        </div>
                      </div>

                      <div className="mb-5 space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                            Subject
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {listing.subject}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                            Topic
                          </p>
                          <p className="text-sm text-slate-600 dark:text-gray-300">
                            {listing.topic || "General topic"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleConnect(listing)}
                        disabled={isConnecting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#8c30e8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnecting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Users size={16} />
                        )}
                        Connect
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
