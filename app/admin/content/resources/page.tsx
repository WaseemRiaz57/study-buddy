"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  FileText,
  FileBadge,
  CheckCircle,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  FileVideo,
  Download,
  Clock,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "pending" | "published";
type FileType = "pdf" | "video" | "doc" | "link";
type ResourceStatus = "pending" | "published";
type UploaderRole = "student" | "mentor";

interface Resource {
  id: number;
  title: string;
  fileType: FileType;
  fileFormat: string;
  uploader: string;
  uploaderAvatar: string;
  uploaderRole: UploaderRole;
  subject: string;
  size: string;
  date: string;
  status: ResourceStatus;
  description: string;
  verified: boolean;
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockResources: Resource[] = [
  {
    id: 1,
    title: "Physics Chapter 4 Notes",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Sophia Chen",
    uploaderAvatar: "SC",
    uploaderRole: "student",
    subject: "Physics",
    size: "4.2 MB",
    date: "Feb 22, 2026",
    status: "pending",
    description:
      "Comprehensive notes covering Electromagnetic Induction, Faraday's Law, and Lenz's law with solved examples and diagrams.",
    verified: false,
  },
  {
    id: 2,
    title: "Intro to React",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "Marcus Lee",
    uploaderAvatar: "ML",
    uploaderRole: "mentor",
    subject: "Web Development",
    size: "—",
    date: "Feb 22, 2026",
    status: "pending",
    description:
      "A 45-minute crash course on React fundamentals: JSX, components, props, state, and hooks. Perfect for beginners.",
    verified: false,
  },
  {
    id: 3,
    title: "Organic Chemistry Reactions Sheet",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Priya Gupta",
    uploaderAvatar: "PG",
    uploaderRole: "student",
    subject: "Chemistry",
    size: "1.8 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "All major organic chemistry reaction mechanisms in a single cheat sheet. Includes named reactions and reagents.",
    verified: false,
  },
  {
    id: 4,
    title: "Data Structures & Algorithms Handbook",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Dr. Anika Rao",
    uploaderAvatar: "AR",
    uploaderRole: "mentor",
    subject: "Computer Science",
    size: "12.6 MB",
    date: "Feb 20, 2026",
    status: "published",
    description:
      "Complete DSA reference guide covering arrays, trees, graphs, dynamic programming, and greedy algorithms with complexity analysis.",
    verified: true,
  },
  {
    id: 5,
    title: "Linear Algebra Lecture Series",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "James Carter",
    uploaderAvatar: "JC",
    uploaderRole: "mentor",
    subject: "Mathematics",
    size: "—",
    date: "Feb 18, 2026",
    status: "published",
    description:
      "12-part lecture series covering vector spaces, eigenvalues, matrix decomposition, and applications in machine learning.",
    verified: true,
  },
  {
    id: 6,
    title: "Biology Lab Report Template",
    fileType: "doc",
    fileFormat: "DOCX",
    uploader: "Ava Patel",
    uploaderAvatar: "AP",
    uploaderRole: "student",
    subject: "Biology",
    size: "320 KB",
    date: "Feb 17, 2026",
    status: "published",
    description:
      "Pre-formatted lab report template with sections for hypothesis, methodology, results, and analysis. APA style.",
    verified: false,
  },
  {
    id: 7,
    title: "Calculus II — Integration Techniques",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Noah Kim",
    uploaderAvatar: "NK",
    uploaderRole: "student",
    subject: "Mathematics",
    size: "2.9 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "Step-by-step guide to integration by parts, trig substitution, partial fractions, and improper integrals.",
    verified: false,
  },
  {
    id: 8,
    title: "Machine Learning Foundations",
    fileType: "video",
    fileFormat: "Video Link",
    uploader: "Marcus Lee",
    uploaderAvatar: "ML",
    uploaderRole: "mentor",
    subject: "Computer Science",
    size: "—",
    date: "Feb 16, 2026",
    status: "published",
    description:
      "Covers supervised & unsupervised learning, neural networks, gradient descent, and model evaluation metrics.",
    verified: true,
  },
  {
    id: 9,
    title: "World History Timeline Poster",
    fileType: "pdf",
    fileFormat: "PDF",
    uploader: "Isla Nguyen",
    uploaderAvatar: "IN",
    uploaderRole: "student",
    subject: "History",
    size: "8.4 MB",
    date: "Feb 21, 2026",
    status: "pending",
    description:
      "A visually rich timeline from ancient civilizations through the modern era, designed as a printable A2 poster.",
    verified: false,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const fileTypeIcon: Record<FileType, React.ElementType> = {
  pdf: FileText,
  video: FileVideo,
  doc: FileBadge,
  link: FileVideo,
};

const fileTypePill: Record<FileType, string> = {
  pdf: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  video:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  doc: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  link: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
};

const roleBadge: Record<UploaderRole, string> = {
  student:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
};

const subjectColors: Record<string, string> = {
  Physics:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "Web Development":
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Chemistry:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Computer Science":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  Mathematics:
    "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  Biology:
    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  History:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
};

const defaultSubjectPill =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400";

const removalReasons = [
  "Copyright violation",
  "Low quality / Incomplete content",
  "Duplicate resource",
  "Inappropriate material",
  "Incorrect subject classification",
];

const subjectOptions = [
  "Physics",
  "Web Development",
  "Chemistry",
  "Computer Science",
  "Mathematics",
  "Biology",
  "History",
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ResourcesLibraryPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResourceForPreview, setSelectedResourceForPreview] =
    useState<Resource | null>(null);

  /* Modal edit state */
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [removalReason, setRemovalReason] = useState(removalReasons[0]);
  const [showRemovalDropdown, setShowRemovalDropdown] = useState(false);

  /* Derived */
  const pendingCount = resources.filter((r) => r.status === "pending").length;
  const publishedCount = resources.filter(
    (r) => r.status === "published"
  ).length;
  const verifiedCount = resources.filter((r) => r.verified).length;
  const totalStorageMB = resources.reduce((acc, r) => {
    const match = r.size.match(/([\d.]+)\s*(MB|KB|GB)/i);
    if (!match) return acc;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "KB") return acc + val / 1024;
    if (unit === "GB") return acc + val * 1024;
    return acc + val;
  }, 0);
  const storageGB = (totalStorageMB / 1024).toFixed(1);

  const filtered = resources.filter((r) => {
    if (r.status !== activeTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.uploader.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)
    );
  });

  /* Actions */
  const openPreview = (resource: Resource) => {
    setSelectedResourceForPreview(resource);
    setEditTitle(resource.title);
    setEditDescription(resource.description);
    setEditSubject(resource.subject);
    setEditVerified(resource.verified);
    setRemovalReason(removalReasons[0]);
  };

  const closePreview = () => setSelectedResourceForPreview(null);

  const handleApprove = (id: number) =>
    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "published" as ResourceStatus } : r
      )
    );

  const handleReject = (id: number) =>
    setResources((prev) => prev.filter((r) => r.id !== id));

  const handleSaveChanges = () => {
    if (!selectedResourceForPreview) return;
    setResources((prev) =>
      prev.map((r) =>
        r.id === selectedResourceForPreview.id
          ? {
              ...r,
              title: editTitle,
              description: editDescription,
              subject: editSubject,
              verified: editVerified,
            }
          : r
      )
    );
    closePreview();
  };

  const handleApproveFromModal = () => {
    if (!selectedResourceForPreview) return;
    handleApprove(selectedResourceForPreview.id);
    closePreview();
  };

  const handleRemoveFromModal = () => {
    if (!selectedResourceForPreview) return;
    handleReject(selectedResourceForPreview.id);
    closePreview();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          Resources Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage uploaded resources, approve submissions, and curate your
          library.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Pending Approvals
            </span>
          </div>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {pendingCount}
          </p>
        </div>

        {/* Verified */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Verified Resources
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {verifiedCount}
          </p>
        </div>

        {/* Storage */}
        <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <HardDrive size={20} />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Storage Used
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {storageGB} GB{" "}
            <span className="text-sm font-normal text-purple-500 dark:text-purple-400/70">
              / 100 GB
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-purple-200/60 dark:bg-purple-500/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  (parseFloat(storageGB) / 100) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "pending"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <Clock size={15} />
          Pending Review
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "pending"
                ? "bg-white/20 text-white"
                : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
            }`}
          >
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "published"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <FileBadge size={15} />
          Published Library
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === "published"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
            }`}
          >
            {publishedCount}
          </span>
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
        />
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_0.6fr_0.8fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resource
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploader
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subject
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Size
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Actions
          </span>
        </div>

        {/* Table rows */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <FileText
                size={40}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-medium">
                No {activeTab} resources found
              </p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {activeTab === "pending"
                  ? "All caught up! No pending reviews."
                  : "No published resources match your search."}
              </p>
            </motion.div>
          ) : (
            filtered.map((resource) => {
              const Icon = fileTypeIcon[resource.fileType];
              return (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25 }}
                  className="group grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_0.6fr_0.8fr_auto] gap-3 lg:gap-4 items-center px-6 py-4 border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Resource Name & Type */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${fileTypePill[resource.fileType]}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                        {resource.title}
                        {resource.verified && (
                          <CheckCircle
                            size={13}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                      </p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${fileTypePill[resource.fileType]}`}
                      >
                        {resource.fileFormat}
                      </span>
                    </div>
                  </div>

                  {/* Uploader */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {resource.uploaderAvatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground dark:text-white truncate">
                        {resource.uploader}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadge[resource.uploaderRole]}`}
                      >
                        {resource.uploaderRole}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        subjectColors[resource.subject] || defaultSubjectPill
                      }`}
                    >
                      {resource.subject}
                    </span>
                  </div>

                  {/* Size */}
                  <p className="text-sm text-muted-foreground">
                    {resource.size}
                  </p>

                  {/* Date */}
                  <p className="text-sm text-muted-foreground">
                    {resource.date}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openPreview(resource)}
                      title="Preview"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-border dark:hover:border-white/10 transition-all"
                    >
                      <Eye size={15} />
                    </button>
                    {resource.status === "pending" && (
                      <button
                        onClick={() => handleApprove(resource.id)}
                        title="Quick Approve"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(resource.id)}
                      title="Reject & Notify"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* ── Resource Preview & Metadata Modal ── */}
      <AnimatePresence>
        {selectedResourceForPreview && (
          <motion.div
            key="resource-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              key="resource-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-border dark:border-white/10 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#0f0a16] z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${fileTypePill[selectedResourceForPreview.fileType]}`}
                  >
                    {(() => {
                      const Icon =
                        fileTypeIcon[selectedResourceForPreview.fileType];
                      return <Icon size={18} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground dark:text-white truncate">
                      {selectedResourceForPreview.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Uploaded by{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {selectedResourceForPreview.uploader}
                      </span>{" "}
                      · {selectedResourceForPreview.date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
                {/* Left — Preview Area */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-border dark:border-white/[0.06]">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Preview
                  </p>
                  <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center h-72 gap-4">
                    {selectedResourceForPreview.fileType === "video" ? (
                      <>
                        <FileVideo
                          size={48}
                          className="text-slate-400 dark:text-slate-600"
                        />
                        <p className="text-sm text-muted-foreground">
                          Video preview not available
                        </p>
                      </>
                    ) : (
                      <>
                        <FileText
                          size={48}
                          className="text-slate-400 dark:text-slate-600"
                        />
                        <p className="text-sm text-muted-foreground">
                          Document preview
                        </p>
                      </>
                    )}
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">
                      <Download size={15} />
                      Download / View Full
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <HardDrive size={12} />
                      {selectedResourceForPreview.size}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fileTypePill[selectedResourceForPreview.fileType]}`}
                    >
                      {selectedResourceForPreview.fileFormat}
                    </span>
                  </div>
                </div>

                {/* Right — Metadata Editor */}
                <div className="p-6 space-y-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Metadata Editor
                  </p>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Subject / Category
                    </label>
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors appearance-none cursor-pointer"
                    >
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verified Badge Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-medium text-foreground dark:text-white">
                        Verified ✅ Badge
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mark as editor&apos;s pick / quality verified
                      </p>
                    </div>
                    <button
                      onClick={() => setEditVerified(!editVerified)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        editVerified
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          editVerified ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle
                        size={15}
                        className="text-red-500 dark:text-red-400"
                      />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Danger Zone
                      </p>
                    </div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70">
                      Remove this resource and notify the uploader.
                    </p>

                    {/* Reason dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowRemovalDropdown(!showRemovalDropdown)
                        }
                        className="w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-lg border border-red-200 dark:border-red-500/20 bg-white dark:bg-black/20 text-foreground dark:text-white transition-colors"
                      >
                        <span className="truncate">{removalReason}</span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 transition-transform duration-200 ${
                            showRemovalDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {showRemovalDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setShowRemovalDropdown(false)}
                          />
                          <div className="absolute left-0 right-0 mt-1 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
                            {removalReasons.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => {
                                  setRemovalReason(reason);
                                  setShowRemovalDropdown(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                  removalReason === reason
                                    ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 font-medium"
                                    : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                }`}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleRemoveFromModal}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                      Remove &amp; Notify User
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-white/[0.06] sticky bottom-0 bg-white dark:bg-[#0f0a16]">
                <button
                  onClick={closePreview}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                {selectedResourceForPreview.status === "pending" && (
                  <button
                    onClick={handleApproveFromModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle size={15} />
                    Approve Resource
                  </button>
                )}
                <button
                  onClick={handleSaveChanges}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
                >
                  <Edit3 size={15} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
