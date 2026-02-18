"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Star,
  Eye,
  FileText,
  HardDrive,
  BookOpen,
  Calendar,
  Flag,
  Share2,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import FlagResourceModal from "@/components/resources/FlagResourceModal";

/* ------------------------------------------------------------------ */
/*  Mock data (would come from API in production)                      */
/* ------------------------------------------------------------------ */
interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

interface ResourceDetail {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  fileType: string;
  fileSize: string;
  pages: number;
  rating: number;
  ratingCount: number;
  author: string;
  authorAvatar: string;
  authorRole: string;
  downloads: number;
  uploadDate: string;
  description: string;
  tags: string[];
  reviews: Review[];
}

const RESOURCE_DATA: Record<string, ResourceDetail> = {
  r1: {
    id: "r1",
    title: "Calculus II Complete Notes",
    subject: "Mathematics",
    subjectCode: "MATH 201",
    fileType: "PDF",
    fileSize: "3.8 MB",
    pages: 42,
    rating: 4.8,
    ratingCount: 64,
    author: "Sarah Johnson",
    authorAvatar: "SJ",
    authorRole: "Teaching Assistant",
    downloads: 1240,
    uploadDate: "Jan 15, 2026",
    description:
      "Comprehensive notes covering integration techniques, series convergence, parametric equations, and polar coordinates. Includes worked examples and practice problems from past exams.",
    tags: ["calculus", "integration", "series", "midterm prep"],
    reviews: [
      {
        id: "rev1",
        author: "Alex Rivera",
        avatar: "AR",
        rating: 5,
        comment: "Best calculus notes I've found. The worked examples are incredibly clear.",
        timeAgo: "3 days ago",
      },
      {
        id: "rev2",
        author: "Priya Sharma",
        avatar: "PS",
        rating: 4,
        comment: "Great coverage of series tests. Wish there were more practice problems.",
        timeAgo: "1 week ago",
      },
    ],
  },
};

/* If no matching resource, generate a fallback */
function getResource(id: string): ResourceDetail {
  if (RESOURCE_DATA[id]) return RESOURCE_DATA[id];
  return {
    id,
    title: "Quantum Mechanics Notes",
    subject: "Physics",
    subjectCode: "PHYS 101",
    fileType: "PDF",
    fileSize: "2.4 MB",
    pages: 28,
    rating: 4.6,
    ratingCount: 38,
    author: "Alex Rivera",
    authorAvatar: "AR",
    authorRole: "Student",
    downloads: 890,
    uploadDate: "Feb 2, 2026",
    description:
      "Detailed study guide covering wave-particle duality, Schrödinger equation, quantum tunneling, and the hydrogen atom model. Includes diagrams and formula summaries.",
    tags: ["quantum", "physics", "waves", "formulas"],
    reviews: [
      {
        id: "rev1",
        author: "Jordan Lee",
        avatar: "JL",
        rating: 5,
        comment: "The diagrams really helped me visualise the concepts.",
        timeAgo: "2 days ago",
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Star helper                                                        */
/* ------------------------------------------------------------------ */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.round(rating)
              ? "text-amber-500 fill-amber-500"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resourceId = params.resourceId as string;
  const resource = getResource(resourceId);

  const [isFlagOpen, setIsFlagOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0c13] p-6 md:p-8">
      {/* ---- Back button ---- */}
      <button
        onClick={() => router.push("/dashboard/resources")}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Resource Hub
      </button>

      {/* ---- Main card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row rounded-2xl overflow-hidden bg-white dark:bg-[#191121] shadow-2xl border border-slate-200 dark:border-white/10"
      >
        {/* ---- Left: Preview pane ---- */}
        <div className="w-full lg:w-5/12 bg-slate-100 dark:bg-white/5 relative flex items-center justify-center min-h-[320px]">
          {/* Blurred "document" visual */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-48 h-64 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 blur-sm" />
          </div>

          <div className="relative text-center z-10">
            <div className="bg-white dark:bg-white/10 p-4 rounded-full mb-3 mx-auto w-16 h-16 flex items-center justify-center">
              <Eye size={28} className="text-slate-700 dark:text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Preview Mode
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Download to view the full document
            </p>
          </div>
        </div>

        {/* ---- Right: Details ---- */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Subject badge */}
          <span className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-lg uppercase tracking-wider">
            {resource.subjectCode}
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mt-3 mb-2 text-slate-900 dark:text-white">
            {resource.title}
          </h1>

          {/* Rating row */}
          <div className="flex items-center gap-3 mb-6">
            <Stars rating={resource.rating} />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {resource.rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({resource.ratingCount} reviews)
            </span>
          </div>

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { icon: FileText, label: resource.fileType },
              { icon: HardDrive, label: resource.fileSize },
              { icon: BookOpen, label: `${resource.pages} pages` },
              { icon: Calendar, label: resource.uploadDate },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400"
              >
                <m.icon size={14} />
                {m.label}
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
            {resource.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-sm font-bold flex items-center justify-center">
              {resource.authorAvatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {resource.author}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {resource.authorRole}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg hover:shadow-emerald-500/20 transition-shadow">
              <Download size={18} />
              Download Resource
            </button>

            <button className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Share2 size={16} /> Share
            </button>

            <button
              onClick={() => setIsFlagOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Flag size={16} /> Report
            </button>
          </div>

          {/* ---- Reviews section ---- */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={18} />
              Reviews ({resource.reviews.length})
            </h2>

            <div className="space-y-4">
              {resource.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center justify-center">
                        {review.avatar}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {review.author}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {review.timeAgo}
                    </span>
                  </div>
                  <Stars rating={review.rating} />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    {review.comment}
                  </p>
                  <button className="flex items-center gap-1 mt-3 text-xs text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    <ThumbsUp size={12} /> Helpful
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Flag Modal ---- */}
      <FlagResourceModal
        isOpen={isFlagOpen}
        onClose={() => setIsFlagOpen(false)}
        resourceTitle={resource.title}
      />
    </div>
  );
}
