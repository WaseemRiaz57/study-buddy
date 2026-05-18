"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlignLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  PenLine,
  UploadCloud,
  X,
  Sparkles as SparklesIcon,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { showRewardToast } from "@/components/gamification/RewardToast";
import { useGamificationStore } from "@/store/useGamificationStore";

type TabId = "notes" | "summarizer" | "quiz";

type QuizQuestion = {
  question: string;
  options?: string[];
  correctOption?: string;
  suggestedAnswer?: string;
  explanation: string;
};

type QuizQuestionType = "mcq" | "short" | "long";

type RecentCreationItem = {
  _id: string;
  type: TabId;
  title: string;
  content: string;
  createdAt: string;
};

const TABS = [
  { id: "notes" as const, label: "Smart Notes", icon: PenLine, generateLabel: "Generate Smart Notes" },
  { id: "summarizer" as const, label: "Summarizer", icon: AlignLeft, generateLabel: "Generate Summary" },
  { id: "quiz" as const, label: "Quiz Builder", icon: BrainCircuit, generateLabel: "Generate Quiz" },
];

const MAX_UPLOADED_TEXT_CHARS = 25000;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n").trim();
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return String(result.value || "").trim();
}

async function extractUploadText(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(file);
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".csv") ||
    file.type.startsWith("text/")
  ) {
    return file.text();
  }

  throw new Error("unsupported-extraction");
}

const historyTypeStyles: Record<TabId, { bg: string; text: string; Icon: LucideIcon }> = {
  notes: { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", Icon: PenLine },
  summarizer: { bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", Icon: AlignLeft },
  quiz: { bg: "bg-purple-100 dark:bg-purple-500/20", text: "text-[#7C3AED]", Icon: BrainCircuit },
};

function isTeacherRole(role: unknown) {
  const normalized = String(role || "").toLowerCase();
  return normalized === "teacher" || normalized === "mentor";
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate).getTime();
  if (Number.isNaN(date)) return "Recently";

  const mins = Math.floor((Date.now() - date) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function serializeQuiz(questions: QuizQuestion[]) {
  return JSON.stringify(questions, null, 2);
}

export default function ContentGeneratorPage() {
  const { data: session, status } = useSession();
  const refreshGamificationStats = useGamificationStore((state) => state.refresh);
  const addGamificationReward = useGamificationStore((state) => state.addReward);
  const isTeacher = isTeacherRole(session?.user?.role);
  const availableTabs = useMemo(
    () => TABS.filter((tab) => tab.id !== "quiz" || isTeacher),
    [isTeacher]
  );

  const [activeTab, setActiveTab] = useState<TabId>("notes");
  const [isGenerating, setIsGenerating] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ message: string } | null>(null);
  const [markdownResult, setMarkdownResult] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [resultType, setResultType] = useState<TabId>("notes");
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentCreations, setRecentCreations] = useState<RecentCreationItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [notesTopic, setNotesTopic] = useState("");
  const [notesDetail, setNotesDetail] = useState("standard");
  const [notesContext, setNotesContext] = useState("");
  const [notesFormat, setNotesFormat] = useState<"bullets" | "paragraphs">("bullets");

  const [summarizerText, setSummarizerText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState("");

  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(5);
  const [quizType, setQuizType] = useState<QuizQuestionType>("mcq");

  const currentTab = availableTabs.find((tab) => tab.id === activeTab) || availableTabs[0];
  const CurrentGenerateIcon = currentTab?.icon || PenLine;
  const hasResult = Boolean(markdownResult || quizQuestions.length);

  const fetchRecentCreations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-notes?limit=6", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRecentCreations(Array.isArray(data) ? data : []);
    } catch {
      setRecentCreations([]);
    }
  }, []);

  useEffect(() => {
    void fetchRecentCreations();
  }, [fetchRecentCreations]);

  useEffect(() => {
    if (!isTeacher && activeTab === "quiz") {
      setActiveTab("notes");
      setQuizQuestions([]);
      setMarkdownResult("");
    }
  }, [activeTab, isTeacher]);

  const resetResult = () => {
    setMarkdownResult("");
    setQuizQuestions([]);
    setCopied(false);
  };

  const resetGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setNotesTopic("");
    setNotesContext("");
    setSummarizerText("");
    setQuizTopic("");
    setUploadedFile(null);
    setUploadedText("");
    resetResult();
  };

  const handleTabChange = (tab: TabId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setActiveTab(tab);
    setResultType(tab);
    setIsGenerating(false);
    setUploadedFile(null);
    setUploadedText("");
    resetResult();
  };

  const buildRequestBody = () => {
    const payload: Record<string, string | number> = {
      type: activeTab,
    };

    if (activeTab === "notes") {
      payload.topic = notesTopic.trim();
      payload.detailLevel = notesDetail;
      payload.additionalContext = notesContext.trim();
      payload.outputFormat = notesFormat;
    }

    if (activeTab === "summarizer") {
      payload.pastedText = summarizerText.trim().slice(0, MAX_UPLOADED_TEXT_CHARS);
    }

    if (activeTab === "quiz") {
      payload.topic = quizTopic.trim();
      payload.difficulty = quizDifficulty;
      payload.questionType = quizType;
      payload.numberOfQuestions = quizCount;
    }

    if (uploadedText) {
      payload.uploadedText = uploadedText.slice(0, MAX_UPLOADED_TEXT_CHARS);
    }

    return payload;
  };

  const validateActiveForm = () => {
    if (activeTab === "notes" && !notesTopic.trim() && !uploadedFile) {
      return "Enter a topic or upload source material.";
    }

    if (activeTab === "summarizer" && !summarizerText.trim() && !uploadedFile) {
      return "Paste text or upload a file to summarize.";
    }

    if (activeTab === "quiz" && !quizTopic.trim() && !uploadedFile) {
      return "Enter a quiz topic or upload source material.";
    }

    return "";
  };

  const handleGenerate = async () => {
    const validationError = validateActiveForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (activeTab === "quiz" && !isTeacher) {
      toast.error("Quiz Builder is available to teacher accounts only.");
      return;
    }

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGenerating(true);
      setResultType(activeTab);
      resetResult();

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestBody()),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403 && data?.upgradeRequired) {
          setUpgradeModal({
            message: data?.message || "Upgrade to Pro to continue using this feature.",
          });
          return;
        }

        throw new Error(data?.message || "Failed to generate content.");
      }

      if (data?.type === "quiz") {
        setQuizQuestions(Array.isArray(data.questions) ? data.questions : []);
      } else {
        setMarkdownResult(String(data?.text || ""));
      }

      await fetchRecentCreations();
      window.dispatchEvent(new Event("ai-notes-updated"));
      addGamificationReward(10, 5);
      await refreshGamificationStats();
      window.dispatchEvent(new Event("gamification-stats-updated"));
      showRewardToast({
        title: "Generation Successful!",
        xp: 10,
        coins: 5,
      });
      false && toast.custom(
        (id) => (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            className="flex w-[340px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#7C3AED]/30 bg-slate-950/95 p-4 text-white shadow-2xl shadow-purple-500/50 backdrop-blur-xl"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#C4B5FD]">
              <SparklesIcon size={22} className="animate-pulse" />
              <Coins size={14} className="absolute -right-1 -top-1 animate-bounce text-yellow-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Generation Successful! 🎉</p>
              <p className="mt-0.5 text-xs font-semibold text-purple-100">
                +10 XP | +5 Coins added.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(id)}
              className="rounded-lg p-1 text-purple-100/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss reward notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        ),
        { duration: 4500 }
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      toast.error(error instanceof Error ? error.message : "Failed to generate content.");
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  const resultForClipboard =
    resultType === "quiz" ? serializeQuiz(quizQuestions) : markdownResult;

  const handleCopy = async () => {
    if (!resultForClipboard) return;
    await navigator.clipboard.writeText(resultForClipboard);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    if (!resultForClipboard.trim()) return;

    const blob = new Blob([resultForClipboard], {
      type: resultType === "quiz" ? "application/json" : "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studybuddy-${resultType}-${Date.now()}.${
      resultType === "quiz" ? "json" : "md"
    }`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            <span className="text-[#7C3AED]">AI Studio</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-text-muted dark:text-slate-400 md:text-lg">
            Generate polished notes, source-aware summaries, and teacher-ready MCQ quizzes.
          </p>
        </motion.header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-7">
            <div className="glass-panel flex rounded-xl p-1.5">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#7C3AED] text-white"
                        : "text-text-muted hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] dark:text-slate-400"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-2xl p-5 md:p-7"
              >
                <div className="space-y-6">
                  {activeTab === "notes" && (
                    <>
                      <InputField
                        id="notes-topic"
                        label="Topic or Concept"
                        placeholder="e.g. Quantum mechanics, French Revolution"
                        value={notesTopic}
                        onChange={setNotesTopic}
                        disabled={Boolean(uploadedFile)}
                      />
                      <SelectField
                        id="notes-detail"
                        label="Detail Level"
                        value={notesDetail}
                        onChange={setNotesDetail}
                        options={[
                          { value: "brief", label: "Brief Overview" },
                          { value: "standard", label: "Standard Explanation" },
                          { value: "comprehensive", label: "Comprehensive Deep Dive" },
                        ]}
                      />
                      <TextAreaField
                        id="notes-context"
                        label="Additional Context"
                        placeholder="Add focus areas, learning goals, or constraints..."
                        value={notesContext}
                        onChange={setNotesContext}
                        rows={3}
                      />
                      <FileDropZone
                        file={uploadedFile}
                        onFile={(file, text) => {
                          setUploadedFile(file);
                          setUploadedText(text);
                        }}
                        onRemove={() => {
                          setUploadedFile(null);
                          setUploadedText("");
                        }}
                      />
                      <FormatSelector value={notesFormat} onChange={setNotesFormat} />
                    </>
                  )}

                  {activeTab === "summarizer" && (
                    <>
                      <TextAreaField
                        id="summary-text"
                        label="Paste Text"
                        placeholder="Paste lecture notes, article text, or study material..."
                        value={summarizerText}
                        onChange={setSummarizerText}
                        rows={10}
                        disabled={Boolean(uploadedFile)}
                      />
                      <FileDropZone
                        file={uploadedFile}
                        onFile={(file, text) => {
                          setUploadedFile(file);
                          setUploadedText(text);
                        }}
                        onRemove={() => {
                          setUploadedFile(null);
                          setUploadedText("");
                        }}
                      />
                    </>
                  )}

                  {activeTab === "quiz" && (
                    <>
                      <InputField
                        id="quiz-topic"
                        label="Quiz Topic"
                        placeholder="e.g. Organic chemistry reactions"
                        value={quizTopic}
                        onChange={setQuizTopic}
                        disabled={Boolean(uploadedFile)}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SelectField
                          id="quiz-difficulty"
                          label="Difficulty"
                          value={quizDifficulty}
                          onChange={setQuizDifficulty}
                          options={[
                            { value: "easy", label: "Easy" },
                            { value: "medium", label: "Medium" },
                            { value: "hard", label: "Hard" },
                          ]}
                        />
                        <SelectField
                          id="quiz-type"
                          label="Question Type"
                          value={quizType}
                          onChange={(value) => setQuizType(value as QuizQuestionType)}
                          options={[
                            { value: "mcq", label: "MCQs" },
                            { value: "short", label: "Short Questions" },
                            { value: "long", label: "Long/Subjective Questions" },
                          ]}
                        />
                      </div>
                      <div>
                        <label htmlFor="quiz-count" className="mb-2 block text-sm font-semibold text-text-main dark:text-slate-200">
                          Number of Questions
                        </label>
                        <input
                          id="quiz-count"
                          type="number"
                          min={1}
                          max={20}
                          value={quizCount}
                          onChange={(event) => setQuizCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-text-main outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#7C3AED] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                        />
                      </div>
                      <FileDropZone
                        file={uploadedFile}
                        onFile={(file, text) => {
                          setUploadedFile(file);
                          setUploadedText(text);
                        }}
                        onRemove={() => {
                          setUploadedFile(null);
                          setUploadedText("");
                        }}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating || status === "loading"}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <CurrentGenerateIcon size={18} />}
                {isGenerating ? "Generating..." : currentTab.generateLabel}
              </button>
              {isGenerating && (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-text-main transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  Stop
                </button>
              )}
            </div>
          </section>

          <section className="flex flex-col lg:col-span-5">
            <ResultPreview
              isLoading={isGenerating}
              hasResult={hasResult}
              resultType={resultType}
              markdownResult={markdownResult}
              quizQuestions={quizQuestions}
              copied={copied}
              onCopy={() => void handleCopy()}
              onDownload={handleDownload}
              onMaximize={() => setIsPreviewMaximized(true)}
              onReset={resetGeneration}
            />
          </section>
        </div>

        <RecentCreations items={recentCreations} />
      </div>

      {isPreviewMaximized && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h3 className="flex items-center gap-2 font-bold text-text-main dark:text-white">
                <span className={`h-2 w-2 rounded-full ${hasResult ? "bg-green-500" : isGenerating ? "animate-pulse bg-amber-400" : "bg-slate-300"}`} />
                Result Preview
              </h3>
              <div className="flex items-center gap-2">
                <IconButton label="Minimize" onClick={() => setIsPreviewMaximized(false)} Icon={Minimize2} />
                <IconButton label="Copy" onClick={() => void handleCopy()} Icon={Copy} disabled={!hasResult} />
                <IconButton label="Download" onClick={handleDownload} Icon={Download} disabled={!hasResult} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ResultBody
                isLoading={isGenerating}
                hasResult={hasResult}
                resultType={resultType}
                markdownResult={markdownResult}
                quizQuestions={quizQuestions}
              />
            </div>
          </div>
        </div>
      )}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section
            className="w-full max-w-md rounded-3xl border border-[#7C3AED]/25 bg-white p-6 text-center shadow-2xl shadow-purple-500/20 dark:bg-[#120d1f]"
            aria-label="Upgrade required"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white">
              <BrainCircuit size={24} />
            </div>
            <h2 className="text-2xl font-black text-foreground">Upgrade to Pro</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {upgradeModal.message}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setUpgradeModal(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
              >
                Not now
              </button>
              <Link
                href="/dashboard/settings/subscription"
                prefetch={true}
                className="min-h-[44px] flex-1 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
              >
                View Plans
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ResultPreview({
  isLoading,
  hasResult,
  resultType,
  markdownResult,
  quizQuestions,
  copied,
  onCopy,
  onDownload,
  onMaximize,
  onReset,
}: {
  isLoading: boolean;
  hasResult: boolean;
  resultType: TabId;
  markdownResult: string;
  quizQuestions: QuizQuestion[];
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onMaximize: () => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-panel flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h3 className="flex items-center gap-2 font-bold text-text-main dark:text-white">
          <span className={`h-2 w-2 rounded-full ${hasResult ? "bg-green-500" : isLoading ? "animate-pulse bg-amber-400" : "bg-slate-300 dark:bg-slate-600"}`} />
          Result Preview
        </h3>
        <div className="flex items-center gap-2">
          <IconButton label="Maximize" onClick={onMaximize} Icon={Maximize2} />
          <button
            type="button"
            onClick={onCopy}
            disabled={!hasResult}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-40"
            title="Copy"
          >
            {copied ? <span className="text-xs font-semibold text-green-600">Copied</span> : <Copy size={16} />}
          </button>
          <IconButton label="Download" onClick={onDownload} Icon={Download} disabled={!hasResult} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <ResultBody
          isLoading={isLoading}
          hasResult={hasResult}
          resultType={resultType}
          markdownResult={markdownResult}
          quizQuestions={quizQuestions}
        />
      </div>
      {hasResult && (
        <div className="border-t border-slate-200 p-4 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            Start New Chat / Generation
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ResultBody({
  isLoading,
  hasResult,
  resultType,
  markdownResult,
  quizQuestions,
}: {
  isLoading: boolean;
  hasResult: boolean;
  resultType: TabId;
  markdownResult: string;
  quizQuestions: QuizQuestion[];
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[86, 72, 91, 64, 78, 50].map((width) => (
          <div
            key={width}
            className="h-4 animate-pulse rounded-lg bg-slate-200 dark:bg-white/[0.08]"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
        <FileText size={46} className="mb-4 opacity-35" />
        <p className="font-semibold">Ready to create.</p>
        <p className="mt-1 text-sm">Choose a tool and generate your first result.</p>
      </div>
    );
  }

  if (resultType === "quiz") {
    return <QuizPreview questions={quizQuestions} />;
  }

  return <MarkdownPreview content={markdownResult} />;
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-main dark:prose-headings:text-white prose-p:text-text-muted dark:prose-p:text-slate-300 prose-strong:text-text-main dark:prose-strong:text-white prose-li:text-text-muted dark:prose-li:text-slate-300">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-4 text-2xl font-extrabold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-bold">{children}</h2>,
          p: ({ children }) => <p className="mb-3 text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-4 border-[#7C3AED] bg-[#7C3AED]/5 p-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function QuizPreview({ questions }: { questions: QuizQuestion[] }) {
  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => (
        <article
          key={`${question.question}-${questionIndex}`}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
              {questionIndex + 1}
            </span>
            <h4 className="text-sm font-bold leading-6 text-text-main dark:text-white">
              {question.question}
            </h4>
          </div>
          {question.options?.length ? (
            <div className="space-y-2">
              {question.options.map((option) => {
              const isCorrect = option === question.correctOption;

              return (
                <div
                  key={option}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    isCorrect
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
                      : "border-slate-200 bg-slate-50 text-text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                  }`}
                >
                  {isCorrect && <CheckCircle2 size={15} />}
                  <span>{option}</span>
                </div>
              );
              })}
            </div>
          ) : question.suggestedAnswer ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-text-muted dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
              <strong className="text-[#7C3AED]">Suggested answer:</strong>{" "}
              {question.suggestedAnswer}
            </div>
          ) : null}
          {question.explanation && (
            <p className="mt-3 rounded-xl bg-[#7C3AED]/5 p-3 text-xs leading-5 text-text-muted dark:text-slate-300">
              <strong className="text-[#7C3AED]">Explanation:</strong> {question.explanation}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function RecentCreations({ items }: { items: RecentCreationItem[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mx-auto mt-14 max-w-6xl"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Recent Creations</h2>
        <button className="flex items-center gap-1 text-sm font-semibold text-[#7C3AED] transition-colors hover:text-purple-700">
          View All <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((item) => {
          const style = historyTypeStyles[item.type] ?? historyTypeStyles.notes;
          const Icon = style.Icon;

          return (
            <article
              key={item._id}
              className="glass-panel rounded-xl p-5 transition-all hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={`rounded-lg p-2 ${style.bg} ${style.text}`}>
                  <Icon size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                  <Clock size={12} />
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
              <h3 className="mb-1 truncate font-bold text-text-main dark:text-white">
                {item.title}
              </h3>
              <p className="line-clamp-2 text-sm text-text-muted dark:text-slate-400">
                {item.content}
              </p>
            </article>
          );
        })}
        {items.length === 0 && (
          <div className="glass-panel rounded-xl p-6 text-center text-text-muted dark:text-slate-400 md:col-span-3">
            Your generated content will appear here.
          </div>
        )}
      </div>
    </motion.section>
  );
}

function FormatSelector({
  value,
  onChange,
}: {
  value: "bullets" | "paragraphs";
  onChange: (value: "bullets" | "paragraphs") => void;
}) {
  return (
    <div>
      <span className="mb-3 block text-sm font-semibold text-text-main dark:text-slate-200">
        Output Format
      </span>
      <div className="flex flex-wrap gap-3">
        {[
          { value: "bullets" as const, label: "Bullet Points" },
          { value: "paragraphs" as const, label: "Paragraphs" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              value === option.value
                ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                : "border-slate-200 bg-white text-text-muted hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-text-main dark:text-slate-200">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-text-main outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#7C3AED] disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-text-main dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-text-main outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#7C3AED] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      </div>
    </div>
  );
}

function TextAreaField({
  id,
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-text-main dark:text-slate-200">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-text-main outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#7C3AED] disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
    </div>
  );
}

function FileDropZone({
  file,
  onFile,
  onRemove,
}: {
  file: File | null;
  onFile: (file: File, text: string) => void;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const handleFile = async (candidate?: File) => {
    if (!candidate) return;
    if (candidate.size > MAX_UPLOAD_BYTES) {
      toast.error("File is too large. Please upload a file under 5MB to respect processing limits.");
      return;
    }

    const name = candidate.name.toLowerCase();
    const supported =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      name.endsWith(".pdf") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".csv") ||
      candidate.type.startsWith("text/") ||
      candidate.type === "text/markdown";

    if (!supported) {
      toast.error("Upload PDF, DOC, DOCX, TXT, XLS, XLSX, or CSV files.");
      return;
    }

    try {
      setIsReading(true);
      const text = (await extractUploadText(candidate)).trim().slice(0, MAX_UPLOADED_TEXT_CHARS);

      if (!text) {
        toast.error("No readable text found in this file.");
        return;
      }

      if (text.length >= MAX_UPLOADED_TEXT_CHARS) {
        toast.info("File text was trimmed to 25,000 characters for AI token safety.");
      }

      onFile(candidate, text);
    } catch {
      toast.error("Could not extract text from this format. Please paste the text directly.");
    } finally {
      setIsReading(false);
    }
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-3">
        <div className="rounded-lg bg-[#7C3AED]/10 p-2 text-[#7C3AED]">
          <FileText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-main dark:text-white">
            {file.name}
          </p>
          <p className="text-xs text-text-muted dark:text-slate-400">
            Ready - extracted text is capped at 25,000 characters
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove uploaded file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-text-main dark:text-slate-200">
        File Upload
      </span>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-[#7C3AED] bg-[#7C3AED]/10"
            : "border-slate-300 bg-white/5 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 dark:border-white/15"
        }`}
      >
        {isReading ? (
          <Loader2 className="animate-spin text-[#7C3AED]" size={28} />
        ) : (
          <UploadCloud className={isDragging ? "text-[#7C3AED]" : "text-slate-400"} size={28} />
        )}
        <span className="text-sm text-text-muted dark:text-slate-400">
          <span className="font-semibold text-[#7C3AED]">Click to upload</span> or drag and drop
        </span>
        <span className="text-xs text-slate-400">PDF, DOC, DOCX, TXT, XLS, XLSX, CSV under 5MB</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,text/plain,text/markdown,text/csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  Icon,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  Icon: LucideIcon;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:text-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-40"
      title={label}
      aria-label={label}
    >
      <Icon size={16} />
    </button>
  );
}
