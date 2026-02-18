"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Library,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import ResourceCard from "@/components/resources/ResourceCard";
import type { Resource } from "@/components/resources/ResourceCard";
import UploadResourceModal from "@/components/resources/UploadResourceModal";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const SUBJECTS = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Literature",
  "History",
  "Philosophy",
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular", icon: TrendingUp },
  { label: "Newest", value: "newest", icon: Clock },
  { label: "Top Rated", value: "rating", icon: Star },
];

const MOCK_RESOURCES: Resource[] = [
  {
    id: "r1",
    title: "Calculus II Complete Notes",
    subject: "Mathematics",
    fileType: "PDF",
    rating: 4.8,
    author: "Sarah J.",
    authorAvatar: "SJ",
    downloads: 1240,
  },
  {
    id: "r2",
    title: "Quantum Mechanics Study Guide",
    subject: "Physics",
    fileType: "PDF",
    rating: 4.6,
    author: "Alex R.",
    authorAvatar: "AR",
    downloads: 890,
  },
  {
    id: "r3",
    title: "Data Structures & Algorithms Cheat Sheet",
    subject: "Computer Science",
    fileType: "DOC",
    rating: 4.9,
    author: "Priya S.",
    authorAvatar: "PS",
    downloads: 2310,
  },
  {
    id: "r4",
    title: "Organic Chemistry Reaction Maps",
    subject: "Chemistry",
    fileType: "IMG",
    rating: 4.3,
    author: "Jordan L.",
    authorAvatar: "JL",
    downloads: 670,
  },
  {
    id: "r5",
    title: "Cell Biology Lab Manual",
    subject: "Biology",
    fileType: "PDF",
    rating: 4.5,
    author: "Taylor M.",
    authorAvatar: "TM",
    downloads: 540,
  },
  {
    id: "r6",
    title: "Linear Algebra Formula Sheet",
    subject: "Mathematics",
    fileType: "XLS",
    rating: 4.7,
    author: "Morgan K.",
    authorAvatar: "MK",
    downloads: 1580,
  },
  {
    id: "r7",
    title: "Shakespeare Analysis Notes",
    subject: "Literature",
    fileType: "DOC",
    rating: 4.2,
    author: "Casey W.",
    authorAvatar: "CW",
    downloads: 320,
  },
  {
    id: "r8",
    title: "World War II Timeline & Key Events",
    subject: "History",
    fileType: "PDF",
    rating: 4.4,
    author: "Riley B.",
    authorAvatar: "RB",
    downloads: 460,
  },
  {
    id: "r9",
    title: "Introduction to Ethics Study Notes",
    subject: "Philosophy",
    fileType: "PDF",
    rating: 4.1,
    author: "Sam T.",
    authorAvatar: "ST",
    downloads: 280,
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [sort, setSort] = useState("popular");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  /* ---- Filtering & sorting ---- */
  const filtered = useMemo(() => {
    let list = MOCK_RESOURCES;

    // Filter by subject
    if (subject !== "All Subjects") {
      list = list.filter((r) => r.subject === subject);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === "popular") return b.downloads - a.downloads;
      if (sort === "rating") return b.rating - a.rating;
      return 0; // "newest" – keep original order
    });

    return list;
  }, [search, subject, sort]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Library size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Digital Library
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Resource Hub
          </h1>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-colors"
        >
          <Plus size={18} />
          Upload Resource
        </button>
      </motion.div>

      {/* ---- Search & Filters bar ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-white/5 p-2 rounded-2xl flex flex-col sm:flex-row gap-3 mb-8 border border-slate-200 dark:border-white/10"
      >
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-3">
          <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-2 text-sm"
            placeholder="Search resources by title, subject, or author…"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Subject filter */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* ---- Resource count ---- */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span>{" "}
        resource{filtered.length !== 1 && "s"}
      </p>

      {/* ---- Grid ---- */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Search size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No resources found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filtered.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ---- Upload Modal ---- */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
