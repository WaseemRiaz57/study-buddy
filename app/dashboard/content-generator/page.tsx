"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  PenLine,
  AlignLeft,
  BrainCircuit,
  Sparkles,
  Copy,
  Download,
  ArrowRight,
  ChevronDown,
  Loader2,
  FileText,
  Clock,
  UploadCloud,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & Data                                                      */
/* ------------------------------------------------------------------ */
type TabId = "notes" | "summarizer" | "quiz";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  generateLabel: string;
}

interface RecentCreationItem {
  _id: string;
  type: TabId;
  title: string;
  content: string;
  createdAt: string;
}

const TABS: Tab[] = [
  { id: "notes", label: "Smart Notes", icon: <PenLine size={16} />, generateLabel: "Generate Smart Notes" },
  { id: "summarizer", label: "Summarizer", icon: <AlignLeft size={16} />, generateLabel: "Generate Summary" },
  { id: "quiz", label: "Quiz Builder", icon: <BrainCircuit size={16} />, generateLabel: "Generate Quiz" },
];

const historyTypeStyles: Record<TabId, { bg: string; text: string; icon: React.ReactNode }> = {
  summarizer: {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: <AlignLeft size={20} />,
  },
  quiz: {
    bg: "bg-purple-100 dark:bg-purple-500/20",
    text: "text-primary dark:text-purple-400",
    icon: <BrainCircuit size={20} />,
  },
  notes: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: <PenLine size={20} />,
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                         */
/* ------------------------------------------------------------------ */
export default function ContentGeneratorPage() {
  const [activeTab, setActiveTab] = useState<TabId>("notes");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");
  const [hasReceivedFirstChunk, setHasReceivedFirstChunk] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentCreations, setRecentCreations] = useState<RecentCreationItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  /* ---- Notes state ---- */
  const [notesTopic, setNotesTopic] = useState("");
  const [notesDetail, setNotesDetail] = useState("standard");
  const [notesContext, setNotesContext] = useState("");
  const [notesFormat, setNotesFormat] = useState<"bullets" | "paragraphs">("bullets");

  /* ---- Summarizer state ---- */
  const [summarizerText, setSummarizerText] = useState("");

  /* ---- File upload state ---- */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  /* ---- Quiz state ---- */
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(10);
  const [quizType, setQuizType] = useState("mcq");

  /* ---- Database Save & Helper Functions (Moved to Top) ---- */
  const fetchRecentCreations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-notes?limit=6", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRecentCreations(Array.isArray(data) ? data : []);
    } catch {
    }
  }, []);

  const deriveGeneratedTitle = useCallback(
    (responseText: string): string => {
      const headingMatch = responseText.match(/^#\s+(.+)$/m);
      if (headingMatch?.[1]) return headingMatch[1].trim();
      if (activeTab === "notes") return notesTopic.trim() || "Generated Notes";
      if (activeTab === "summarizer") {
        const firstLine = summarizerText.trim().split("\n")[0] || "Generated Summary";
        return firstLine.slice(0, 80);
      }
      if (activeTab === "quiz") return quizTopic.trim() || "Generated Quiz";
      return "Generated Content";
    },
    [activeTab, notesTopic, summarizerText, quizTopic]
  );

  const saveGeneratedNote = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      try {
        const title = deriveGeneratedTitle(content);
        const res = await fetch("/api/ai-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, type: activeTab }),
        });

        if (!res.ok) return;

        await fetchRecentCreations();
        window.dispatchEvent(new Event("ai-notes-updated"));
      } catch {
      }
    },
    [activeTab, deriveGeneratedTitle, fetchRecentCreations]
  );


  /* ---- Main Handlers ---- */
  const handleGenerate = useCallback(async () => {
    let userPrompt = "";
    let outputMode: "bullets" | "paragraphs" | "mcq" | "direct" | "unknown" = "unknown";

    if (activeTab === "notes") {
      if (!notesTopic.trim() && !uploadedFile) {
        setAiResponseText("Please enter a topic or concept, or upload a file.");
        return;
      }

      if (notesTopic.trim()) {
        userPrompt = [
          `Create smart study notes on: ${notesTopic.trim()}`,
          `Detail level: ${notesDetail}.`,
          notesContext.trim() ? `Additional context: ${notesContext.trim()}` : "",
          `Output format: ${notesFormat}.`,
        ]
          .filter(Boolean)
          .join("\n");
      } else {
        userPrompt = [
          "Create detailed smart study notes from the uploaded document.",
          `Detail level: ${notesDetail}.`,
          notesContext.trim() ? `Additional context: ${notesContext.trim()}` : "",
          `Output format: ${notesFormat}.`,
        ]
          .filter(Boolean)
          .join("\n");
      }

      outputMode = notesFormat;
    }

    if (activeTab === "summarizer") {
      if (!summarizerText.trim() && !uploadedFile) {
        setAiResponseText("Please paste text or upload a file to summarize.");
        return;
      }
      userPrompt = summarizerText.trim()
        ? `Summarize this text:\n\n${summarizerText.trim()}`
        : "Summarize the uploaded document in clear study notes.";
    }

    if (activeTab === "quiz") {
      if (!quizTopic.trim() && !uploadedFile) {
        setAiResponseText("Please enter a quiz topic or upload a file.");
        return;
      }
      const questionTypeLabel = quizType === "mcq" ? "multiple choice (MCQ)" : "direct/short-answer";
      if (quizTopic.trim()) {
        userPrompt = `Create a ${quizDifficulty} difficulty quiz with ${quizCount} ${questionTypeLabel} questions on: ${quizTopic.trim()}`;
      } else {
        userPrompt = `Create a ${quizDifficulty} difficulty quiz with ${quizCount} ${questionTypeLabel} questions based on the content of the uploaded file.`;
      }

      outputMode = quizType === "mcq" ? "mcq" : "direct";
    }

    setIsGenerating(true);
    setAiResponseText("");
    setHasReceivedFirstChunk(false);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let response: Response;
      const canAttachFile = uploadedFile !== null;

      if (canAttachFile) {
        const formData = new FormData();
        formData.append("userPrompt", userPrompt);
        formData.append("outputMode", outputMode);
        formData.append("file", uploadedFile);

        response = await fetch("/api/generate-content", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } else {
        response = await fetch("/api/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userPrompt, outputMode }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to generate content");
      }

      if (!response.body) {
        throw new Error("No stream available from API");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk.length > 0) {
          setHasReceivedFirstChunk(true);
          streamedText += chunk;
          setAiResponseText((prev) => prev + chunk);
        }
      }

      const lastChunk = decoder.decode();
      if (lastChunk) {
        setHasReceivedFirstChunk(true);
        streamedText += lastChunk;
        setAiResponseText((prev) => prev + lastChunk);
      }

      const finalText = streamedText.trim() ? streamedText : "No response generated.";
      setAiResponseText(finalText);

      if (streamedText.trim()) {
        await saveGeneratedNote(streamedText);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message = error instanceof Error ? error.message : "Failed to generate content";
      setAiResponseText(message);
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, [activeTab, notesTopic, notesDetail, notesContext, notesFormat, summarizerText, uploadedFile, quizTopic, quizDifficulty, quizCount, quizType, saveGeneratedNote]);

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (aiResponseText) {
      navigator.clipboard.writeText(aiResponseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [aiResponseText]);

  const handleDownload = useCallback(() => {
    if (!aiResponseText.trim()) return;
    const blob = new Blob([aiResponseText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-content-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [aiResponseText]);

  const formatRelativeTime = useCallback((isoDate: string) => {
    const date = new Date(isoDate).getTime();
    const now = Date.now();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  useEffect(() => {
    fetchRecentCreations();
  }, [fetchRecentCreations]);

  const handleTabChange = (tab: TabId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveTab(tab);
    setAiResponseText("");
    setHasReceivedFirstChunk(false);
    setIsGenerating(false);
    setUploadedFile(null);
  };

  const handleFileDrop = useCallback((file: File) => {
    const allowed = [".pdf", ".docx", ".txt", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (allowed.includes(ext) || allowed.includes(file.type)) {
      setUploadedFile(file);
    }
  }, []);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  /* ================================================================ */
  /* RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background accent glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-40 bg-primary/10 dark:bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER                                                      */}
        {/* ============================================================ */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              AI Studio
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted dark:text-slate-400 max-w-2xl mx-auto">
            Generate Notes, Summaries, and Quizzes instantly with our advanced AI engine.
          </p>
        </motion.header>

        {/* ============================================================ */}
        {/* MAIN GRID                                                   */}
        {/* ============================================================ */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ---------------------------------------------------------- */}
          {/* LEFT PANEL — Controls                                      */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab Navigation */}
            <div className="glass-panel rounded-xl p-1.5 flex space-x-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-text-muted dark:text-slate-400 hover:text-text-main dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Input Module */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden"
              >
                {/* Decorative corner blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-bl-full -z-0" />

                <div className="relative z-10 space-y-6">
                  {/* ---- Smart Notes ---- */}
                  {activeTab === "notes" && (
                    <>
                      <div className={uploadedFile ? "opacity-50 pointer-events-none" : ""}>
                        <InputField
                          id="topic"
                          label="Topic or Concept"
                          placeholder="e.g. Quantum Mechanics, The French Revolution"
                          value={notesTopic}
                          onChange={setNotesTopic}
                        />
                      </div>
                      <SelectField
                        id="detail"
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
                        id="context"
                        label="Additional Context (Optional)"
                        placeholder="Add specific keywords or focus areas..."
                        value={notesContext}
                        onChange={setNotesContext}
                        rows={3}
                      />
                      {/* File Upload Zone */}
                      <FileDropZone
                        file={uploadedFile}
                        onFile={handleFileDrop}
                        onRemove={() => setUploadedFile(null)}
                      />

                      {/* Format radio */}
                      <div>
                        <span className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-3">
                          Output Format
                        </span>
                        <div className="flex gap-3">
                          {(["bullets", "paragraphs"] as const).map((fmt) => (
                            <label
                              key={fmt}
                              className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                notesFormat === fmt
                                  ? "border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-text-muted dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                              }`}
                            >
                              <input
                                type="radio"
                                name="format"
                                className="hidden"
                                checked={notesFormat === fmt}
                                onChange={() => setNotesFormat(fmt)}
                              />
                              <span className={`w-2 h-2 rounded-full ${notesFormat === fmt ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`} />
                              {fmt === "bullets" ? "Bullet Points" : "Paragraphs"}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- Summarizer ---- */}
                  {activeTab === "summarizer" && (
                    <>
                      <div className={uploadedFile ? "opacity-50 pointer-events-none" : ""}>
                        <TextAreaField
                          id="summarizer-input"
                          label="Paste your text below"
                          placeholder="Paste an article, essay, or any block of text you want to summarize…"
                          value={summarizerText}
                          onChange={setSummarizerText}
                          rows={10}
                        />
                      </div>

                      {/* File Upload Zone */}
                      <FileDropZone
                        file={uploadedFile}
                        onFile={handleFileDrop}
                        onRemove={() => setUploadedFile(null)}
                      />
                    </>
                  )}

                  {/* ---- Quiz Builder ---- */}
                  {activeTab === "quiz" && (
                    <>
                      <div className={uploadedFile ? "opacity-50 pointer-events-none" : ""}>
                        <InputField
                          id="quiz-topic"
                          label="Topic"
                          placeholder="e.g. Organic Chemistry, World War II"
                          value={quizTopic}
                          onChange={setQuizTopic}
                        />
                      </div>
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
                        onChange={setQuizType}
                        options={[
                          { value: "mcq", label: "Multiple Choice (MCQs)" },
                          { value: "direct", label: "Direct Questions" },
                        ]}
                      />
                      <div>
                        <label
                          htmlFor="quiz-count"
                          className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-2"
                        >
                          Number of Questions
                        </label>
                        <input
                          id="quiz-count"
                          type="number"
                          min={1}
                          max={50}
                          value={quizCount}
                          onChange={(e) => setQuizCount(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                      {/* File Upload Zone */}
                      <FileDropZone
                        file={uploadedFile}
                        onFile={handleFileDrop}
                        onRemove={() => setUploadedFile(null)}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-purple-400 p-4 text-white shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-colors" />
              <div className="relative flex items-center justify-center gap-2 font-bold text-lg">
                {isGenerating ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Sparkles size={20} className="animate-pulse" />
                )}
                {isGenerating ? "Generating…" : currentTab.generateLabel}
              </div>
            </button>

            {isGenerating && (
              <button
                onClick={handleStopGenerating}
                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/70 dark:bg-white/[0.04] p-3 text-sm font-semibold text-text-main dark:text-white transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.08]"
              >
                Stop Generating
              </button>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT PANEL — Result Preview                                */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel rounded-2xl flex flex-col h-full min-h-[400px] overflow-hidden relative"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${aiResponseText ? "bg-green-400" : isGenerating ? "bg-amber-400 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                  Result Preview
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPreviewMaximized(true)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
                    title="Maximize"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!aiResponseText}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Copy"
                  >
                    {copied ? <span className="text-xs text-green-500 font-medium">Copied!</span> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!aiResponseText}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-grow p-6 overflow-y-auto relative">
                <AnimatePresence mode="wait">
                  {isGenerating && !hasReceivedFirstChunk ? (
                    /* Loading shimmer */
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 rounded-lg bg-slate-200 dark:bg-white/[0.06] animate-pulse"
                          style={{ width: `${85 - i * 10}%` }}
                        />
                      ))}
                    </motion.div>
                  ) : aiResponseText ? (
                    /* Generated content */
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-main dark:prose-headings:text-white prose-p:text-text-muted dark:prose-p:text-slate-300 prose-strong:text-text-main dark:prose-strong:text-white prose-li:text-text-muted dark:prose-li:text-slate-300"
                    >
                      <ResultRenderer content={aiResponseText} />
                    </motion.div>
                  ) : (
                    /* Empty state */
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center"
                    >
                      <FileText size={48} className="mb-4 opacity-30" />
                      <p className="font-medium">Ready to create.</p>
                      <p className="text-sm mt-1">Select a tool and start generating content.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom scroll fade */}
                {aiResponseText && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-[#0f0a16]/80 to-transparent pointer-events-none" />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RECENT CREATIONS                                            */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-main dark:text-white">Recent Creations</h2>
            <button className="text-sm text-primary hover:text-primary-soft font-medium flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentCreations.map((item) => {
              const style = historyTypeStyles[item.type as TabId] ?? historyTypeStyles.notes;
              return (
                <motion.div
                  key={item._id}
                  whileHover={{ y: -4 }}
                  className="group glass-panel rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                      {style.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted dark:text-slate-400 line-clamp-2">
                    {item.content}
                  </p>
                </motion.div>
              );
            })}
            {recentCreations.length === 0 && (
              <div className="md:col-span-3 glass-panel rounded-xl p-6 text-center text-text-muted dark:text-slate-400">
                Your generated notes will appear here.
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {isPreviewMaximized && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 md:p-8">
          <div className="rounded-2xl h-full max-w-5xl mx-auto flex flex-col overflow-hidden bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
              <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiResponseText ? "bg-green-400" : isGenerating ? "bg-amber-400 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                Result Preview
              </h3>
              <div className="flex gap-2">
                {isGenerating && (
                  <button
                    onClick={handleStopGenerating}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-gray-600 text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                    title="Stop Generation"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={() => setIsPreviewMaximized(false)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!aiResponseText}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Copy"
                >
                  {copied ? <span className="text-xs text-green-500 font-medium">Copied!</span> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!aiResponseText}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="flex-grow p-6 overflow-y-auto relative bg-white dark:bg-gray-900">
              {isGenerating && !hasReceivedFirstChunk ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 rounded-lg bg-slate-200 dark:bg-white/[0.06] animate-pulse"
                      style={{ width: `${85 - i * 10}%` }}
                    />
                  ))}
                </div>
              ) : aiResponseText ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-text-main dark:prose-headings:text-white prose-p:text-text-muted dark:prose-p:text-slate-300 prose-strong:text-text-main dark:prose-strong:text-white prose-li:text-text-muted dark:prose-li:text-slate-300">
                  <ResultRenderer content={aiResponseText} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                  <FileText size={48} className="mb-4 opacity-30" />
                  <p className="font-medium">Ready to create.</p>
                  <p className="text-sm mt-1">Select a tool and start generating content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable Form Fields                                              */
/* ------------------------------------------------------------------ */
function InputField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main dark:text-white appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-50 text-text-main dark:bg-[#1a1425] dark:text-slate-100">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
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
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-2">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-text-main dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* File Drop Zone                                                    */
/* ------------------------------------------------------------------ */
function FileDropZone({
  file,
  onFile,
  onRemove,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };
  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.txt";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) onFile(f);
    };
    input.click();
  };

  // File selected — show card
  if (file) {
    const sizeKB = (file.size / 1024).toFixed(1);
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-main dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-text-muted dark:text-slate-400">{sizeKB} KB</p>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // Drop zone
  return (
    <div>
      <label className="block text-sm font-semibold text-text-main dark:text-slate-200 mb-2">
        Or upload a file
      </label>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center gap-2 p-6 rounded-xl
          border-2 border-dashed cursor-pointer transition-all
          ${isDragging
            ? "border-primary bg-primary/10 dark:bg-primary/15"
            : "border-slate-300 dark:border-white/15 bg-white/5 dark:bg-white/[0.03] hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/5"
          }
        `}
      >
        <UploadCloud size={28} className={`${isDragging ? "text-primary" : "text-slate-400 dark:text-slate-500"} transition-colors`} />
        <p className="text-sm text-text-muted dark:text-slate-400 text-center">
          <span className="font-medium text-primary">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">PDF, DOCX, TXT</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result Renderer (simple markdown-like)                            */
/* ------------------------------------------------------------------ */
function ResultRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-extrabold text-text-main dark:text-white mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-text-main dark:text-white mt-6 mb-3">{children}</h2>
        ),
        blockquote: ({ children }) => (
          <blockquote className="bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg my-4">
            <div className="text-sm text-text-muted dark:text-slate-300">{children}</div>
          </blockquote>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-text-muted dark:text-slate-300 mb-3">{children}</p>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 space-y-3 text-text-main dark:text-white">{children}</ol>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 space-y-2 text-text-muted dark:text-slate-300">{children}</ul>
        ),
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-text-main dark:text-white">{children}</strong>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}