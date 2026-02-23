"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  AlertTriangle,
  ShieldBan,
  Edit3,
  Trash2,
  CheckCircle,
  Search,
  Filter,
  MessageSquareQuote,
  X,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "flagged" | "all_logs";
type ContentType = "quiz" | "summary" | "flashcards";
type FlagReason =
  | "Inaccurate Dates"
  | "Inappropriate Language"
  | "Hallucinated Facts"
  | "Off-Topic Output"
  | null;

interface AILogItem {
  id: number;
  user: string;
  userAvatar: string;
  userRole: "student" | "mentor";
  contentType: ContentType;
  prompt: string;
  systemContext: string;
  aiOutput: string;
  flagReason: FlagReason;
  date: string;
  suspended: boolean;
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
const mockLogs: AILogItem[] = [
  {
    id: 1,
    user: "Ali Hassan",
    userAvatar: "AH",
    userRole: "student",
    contentType: "summary",
    prompt: "Summarize the key events and turning points of World War II",
    systemContext:
      "You are a history tutor. Provide accurate, concise summaries suitable for high-school level students. Cite specific dates and events.",
    aiOutput:
      "World War II (1939–1945) was a global conflict involving most of the world's nations. Key turning points include the invasion of Poland in September 1940, the Battle of Stalingrad in 1942–1943, D-Day (June 6, 1944), and the atomic bombings of Hiroshima and Nagasaki in August 1945. The war resulted in an estimated 70–85 million fatalities.\n\nNote: The invasion of Poland actually occurred in September 1939, not 1940. This is a factual error that needs correction.",
    flagReason: "Inaccurate Dates",
    date: "Feb 23, 2026",
    suspended: false,
  },
  {
    id: 2,
    user: "Jessica Moore",
    userAvatar: "JM",
    userRole: "student",
    contentType: "quiz",
    prompt: "Generate a 10-question quiz on organic chemistry reactions",
    systemContext:
      "You are a chemistry tutor. Generate multiple-choice questions with 4 options each. Mark the correct answer clearly.",
    aiOutput:
      "Quiz: Organic Chemistry Reactions\n\n1. What is the product of the Grignard reaction between CH₃MgBr and formaldehyde?\n   a) Methanol\n   b) Ethanol ✓\n   c) Propanol\n   d) Butanol\n\n2. Which reagent is used for Swern oxidation?\n   a) KMnO₄\n   b) DMSO/Oxalyl chloride ✓\n   c) PCC\n   d) Jones reagent\n\n3. The Diels-Alder reaction is an example of:\n   a) [2+2] cycloaddition\n   b) [4+2] cycloaddition ✓\n   c) Electrophilic addition\n   d) Free radical substitution",
    flagReason: null,
    date: "Feb 22, 2026",
    suspended: false,
  },
  {
    id: 3,
    user: "Ryan Chang",
    userAvatar: "RC",
    userRole: "student",
    contentType: "flashcards",
    prompt: "Create flashcards about machine learning algorithms including some controversial opinions",
    systemContext:
      "You are an AI/ML tutor. Create clear flashcards with term on front and definition on back. Stay factual and academic.",
    aiOutput:
      "Flashcard 1:\nFront: Linear Regression\nBack: A supervised learning algorithm that models the relationship between variables using a linear equation. Used for predicting continuous outcomes.\n\nFlashcard 2:\nFront: Neural Networks\nBack: These are basically just hype and a waste of compute power. Nobody serious uses them anymore since quantum computing made them obsolete.\n\nFlashcard 3:\nFront: Random Forest\nBack: An ensemble learning method that constructs multiple decision trees during training and outputs the mode of their predictions.",
    flagReason: "Hallucinated Facts",
    date: "Feb 22, 2026",
    suspended: false,
  },
  {
    id: 4,
    user: "Samira Patel",
    userAvatar: "SP",
    userRole: "mentor",
    contentType: "summary",
    prompt: "Explain quantum entanglement for undergraduate physics students",
    systemContext:
      "You are a physics tutor. Provide clear, accurate explanations suitable for undergraduate physics majors. Use analogies where helpful.",
    aiOutput:
      "Quantum entanglement is a phenomenon where two or more particles become interconnected such that the quantum state of each particle cannot be described independently. When measured, entangled particles exhibit correlated results regardless of the distance between them.\n\nKey points:\n- First theorized by Einstein, Podolsky, and Rosen (EPR paradox, 1935)\n- Bell's theorem (1964) provided testable predictions\n- Verified experimentally by Aspect et al. (1982)\n- Does NOT allow faster-than-light communication\n- Fundamental to quantum computing and quantum cryptography",
    flagReason: null,
    date: "Feb 21, 2026",
    suspended: false,
  },
  {
    id: 5,
    user: "Derek Wu",
    userAvatar: "DW",
    userRole: "student",
    contentType: "quiz",
    prompt: "Make a quiz but include some trick questions that insult students who get them wrong",
    systemContext:
      "You are a general tutor. Generate educational quiz content that is respectful and constructive.",
    aiOutput:
      "Quiz: General Knowledge\n\n1. What's the capital of France?\n   a) London (If you picked this, you're an idiot)\n   b) Paris ✓\n   c) Berlin\n   d) Madrid\n\n2. What year did the Titanic sink?\n   a) 1910\n   b) 1912 ✓\n   c) 1915 (Only a moron would pick this)\n   d) 1920",
    flagReason: "Inappropriate Language",
    date: "Feb 20, 2026",
    suspended: false,
  },
  {
    id: 6,
    user: "Lena Kowalski",
    userAvatar: "LK",
    userRole: "student",
    contentType: "flashcards",
    prompt: "Create flashcards about the French Revolution for my history exam",
    systemContext:
      "You are a history tutor. Create accurate flashcards with clear terms and concise definitions.",
    aiOutput:
      "Flashcard 1:\nFront: Storming of the Bastille\nBack: July 14, 1789 — Parisian revolutionaries stormed the Bastille fortress-prison, symbolizing the fall of royal authority.\n\nFlashcard 2:\nFront: Declaration of the Rights of Man\nBack: Adopted August 26, 1789 — Defined individual and collective rights, inspired by Enlightenment philosophy.\n\nFlashcard 3:\nFront: Reign of Terror\nBack: September 1793 – July 1794 — Period of political purges led by the Committee of Public Safety under Robespierre. ~17,000 executed.",
    flagReason: null,
    date: "Feb 19, 2026",
    suspended: false,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const contentTypeBadge: Record<ContentType, string> = {
  quiz: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  summary:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  flashcards:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const flagBadge: Record<string, string> = {
  "Inaccurate Dates":
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  "Inappropriate Language":
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  "Hallucinated Facts":
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "Off-Topic Output":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function AIContentReviewPage() {
  const [logs, setLogs] = useState<AILogItem[]>(mockLogs);
  const [activeTab, setActiveTab] = useState<Tab>("flagged");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemForReview, setSelectedItemForReview] =
    useState<AILogItem | null>(null);
  const [editedOutput, setEditedOutput] = useState("");

  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  /* Derived */
  const flaggedCount = logs.filter((l) => l.flagReason !== null).length;
  const suspendedCount = logs.filter((l) => l.suspended).length;

  const filtered = logs.filter((l) => {
    if (activeTab === "flagged" && l.flagReason === null) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.user.toLowerCase().includes(q) ||
      l.prompt.toLowerCase().includes(q);
    const matchesType =
      contentTypeFilter === "all" || l.contentType === contentTypeFilter;
    return matchesSearch && matchesType;
  });

  /* Actions */
  const openReview = (item: AILogItem) => {
    setSelectedItemForReview(item);
    setEditedOutput(item.aiOutput);
  };

  const closeReview = () => setSelectedItemForReview(null);

  const handleSaveCorrections = () => {
    if (!selectedItemForReview) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.id === selectedItemForReview.id
          ? { ...l, aiOutput: editedOutput, flagReason: null }
          : l
      )
    );
    closeReview();
  };

  const handleDeleteContent = (id: number) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (selectedItemForReview?.id === id) closeReview();
  };

  const handleSuspendUser = () => {
    if (!selectedItemForReview) return;
    setLogs((prev) =>
      prev.map((l) =>
        l.id === selectedItemForReview.id ? { ...l, suspended: true } : l
      )
    );
    closeReview();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          AI Content Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor, correct, and moderate AI-generated study materials.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Generations */}
        <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bot size={20} />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Total Generations
            </span>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            12,450
          </p>
        </div>

        {/* Flagged */}
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center text-red-500 dark:text-red-400">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Flagged for Review
            </span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-300">
            {flaggedCount}
          </p>
        </div>

        {/* Suspensions */}
        <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50/40 dark:bg-orange-500/[0.04] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center text-orange-500 dark:text-orange-400">
              <ShieldBan size={20} />
            </div>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              AI Suspensions
            </span>
          </div>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-300">
            {suspendedCount}
          </p>
        </div>
      </div>

      {/* ── Tabs + Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
          <button
            onClick={() => setActiveTab("flagged")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "flagged"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <AlertTriangle size={15} />
            Flagged Content
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "flagged"
                  ? "bg-white/20 text-white"
                  : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
              }`}
            >
              {flaggedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("all_logs")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "all_logs"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Bot size={15} />
            All Generation Logs
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or users..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Content Type Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-muted-foreground hover:text-foreground dark:hover:text-white hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors whitespace-nowrap"
            >
              <Filter size={14} />
              Content Type
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-xl z-40 py-1.5 overflow-hidden">
                  {[
                    { value: "all", label: "All Types" },
                    { value: "quiz", label: "Quiz" },
                    { value: "summary", label: "Summary" },
                    { value: "flashcards", label: "Flashcards" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setContentTypeFilter(opt.value);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        contentTypeFilter === opt.value
                          ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 font-medium"
                          : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[1.2fr_0.8fr_1.5fr_1fr_0.7fr_auto] gap-4 px-6 py-3 border-b border-border dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content Type
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User Prompt
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Flag Reason
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date
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
              <Bot
                size={40}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm font-medium">No AI logs found</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {activeTab === "flagged"
                  ? "No flagged content to review. All clear!"
                  : "No generation logs match your search."}
              </p>
            </motion.div>
          ) : (
            filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                className="group grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_1.5fr_1fr_0.7fr_auto] gap-3 lg:gap-4 items-center px-6 py-4 border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {item.userAvatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                      {item.user}
                      {item.suspended && (
                        <ShieldBan
                          size={13}
                          className="text-orange-500 shrink-0"
                        />
                      )}
                    </p>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {item.userRole}
                    </span>
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${contentTypeBadge[item.contentType]}`}
                  >
                    <Sparkles size={11} />
                    {item.contentType}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  &ldquo;{item.prompt}&rdquo;
                </p>

                {/* Flag Reason */}
                <div>
                  {item.flagReason ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        flagBadge[item.flagReason] ||
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {item.flagReason}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <CheckCircle size={11} />
                      Clean
                    </span>
                  )}
                </div>

                {/* Date */}
                <p className="text-sm text-muted-foreground">{item.date}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openReview(item)}
                    title="Review & Edit"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 transition-all"
                  >
                    <Edit3 size={13} />
                    <span className="hidden xl:inline">Review</span>
                  </button>
                  <button
                    onClick={() => handleDeleteContent(item.id)}
                    title="Quick Delete"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Review & Moderation Modal ── */}
      <AnimatePresence>
        {selectedItemForReview && (
          <motion.div
            key="review-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeReview}
          >
            <motion.div
              key="review-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-purple-500/20 dark:border-purple-500/15 bg-white dark:bg-[#0f0a16] shadow-2xl shadow-purple-500/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#0f0a16] z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Bot size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground dark:text-white truncate">
                      Review AI Output
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedItemForReview.user} ·{" "}
                      <span className="capitalize">
                        {selectedItemForReview.contentType}
                      </span>{" "}
                      · {selectedItemForReview.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItemForReview.flagReason && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        flagBadge[selectedItemForReview.flagReason] ||
                        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {selectedItemForReview.flagReason}
                    </span>
                  )}
                  <button
                    onClick={closeReview}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body — Split View */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border dark:divide-white/[0.06]">
                {/* Left Panel — Context */}
                <div className="p-6 space-y-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Context & Prompt
                  </p>

                  {/* User Details */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {selectedItemForReview.userAvatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-white flex items-center gap-2">
                        {selectedItemForReview.user}
                        {selectedItemForReview.suspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
                            <ShieldBan size={10} />
                            Suspended
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedItemForReview.userRole} ·{" "}
                        <span className="capitalize">
                          {selectedItemForReview.contentType}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <MessageSquareQuote size={12} />
                      User Prompt
                    </label>
                    <div className="relative rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/[0.04] p-4">
                      <p className="text-sm text-foreground dark:text-white/90 leading-relaxed italic">
                        &ldquo;{selectedItemForReview.prompt}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* System Context */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <Bot size={12} />
                      System Context
                    </label>
                    <div className="rounded-xl border border-border dark:border-white/10 bg-slate-50 dark:bg-black/30 p-4">
                      <code className="text-xs text-muted-foreground leading-relaxed block whitespace-pre-wrap font-mono">
                        {selectedItemForReview.systemContext}
                      </code>
                    </div>
                  </div>

                  {/* Content Type & Date */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${contentTypeBadge[selectedItemForReview.contentType]}`}
                    >
                      <Sparkles size={11} />
                      {selectedItemForReview.contentType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {selectedItemForReview.date}
                    </span>
                  </div>
                </div>

                {/* Right Panel — AI Output Editor */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      AI Output — Edit Mode
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                      Editable
                    </span>
                  </div>
                  <textarea
                    value={editedOutput}
                    onChange={(e) => setEditedOutput(e.target.value)}
                    rows={18}
                    className="w-full px-4 py-3.5 text-sm rounded-xl border border-purple-200 dark:border-purple-500/20 bg-white dark:bg-black/30 text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer — Actions */}
              <div className="px-6 py-4 border-t border-border dark:border-white/[0.06] sticky bottom-0 bg-white dark:bg-[#0f0a16]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Danger Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleDeleteContent(selectedItemForReview.id)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete Content
                    </button>
                    <button
                      onClick={handleSuspendUser}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 transition-colors"
                    >
                      <ShieldBan size={14} />
                      Suspend AI Access
                    </button>
                  </div>

                  {/* Primary Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeReview}
                      className="px-5 py-2.5 text-sm font-medium rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] text-foreground dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCorrections}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle size={15} />
                      Save Corrections &amp; Approve
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
