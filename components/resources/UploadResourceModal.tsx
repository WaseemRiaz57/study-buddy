"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  FileUp,
  Loader2,
  Search,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { showRewardToast } from "@/components/gamification/RewardToast";
import { useGamificationStore } from "@/store/useGamificationStore";

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Literature",
  "History",
  "Philosophy",
];

export default function UploadResourceModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadResourceModalProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addReward = useGamificationStore((state) => state.addReward);

  const filteredSubjects = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return SUBJECTS;

    return SUBJECTS.filter((item) => item.toLowerCase().includes(query));
  }, [searchValue]);

  const canCreateSubject =
    searchValue.trim().length > 0 &&
    !SUBJECTS.some(
      (item) => item.toLowerCase() === searchValue.trim().toLowerCase()
    );

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) setFile(selected);
  };

  const selectSubject = (value: string) => {
    const nextSubject = value.trim();
    setSubject(nextSubject);
    setSearchValue(nextSubject);
    setSubjectOpen(false);
  };

  const validateForm = () => {
    const checks = [
      { valid: title.trim().length > 0, message: "Title is required." },
      { valid: subject.trim().length > 0, message: "Subject is required." },
      {
        valid: description.trim().length > 0,
        message: "Description is required.",
      },
      { valid: Boolean(file), message: "Please choose a resource file." },
    ];
    const failed = checks.find((check) => !check.valid);

    if (failed) {
      setError(failed.message);
      toast.error(failed.message);
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setSearchValue("");
    setSubjectOpen(false);
    setDescription("");
    setPrice("0");
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("subject", subject.trim());
      formData.append("description", description.trim());
      formData.append("price", price.trim() || "0");
      formData.append("file", file as File);

      const response = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Upload failed.");
      }

      const xpAwarded = Number(data?.reward?.xpAwarded || 0);
      const coinsAwarded = Number(data?.reward?.coinsAwarded || 0);

      if (xpAwarded || coinsAwarded) {
        addReward(xpAwarded, coinsAwarded);
        showRewardToast({
          title: "Resource Uploaded!",
          xp: xpAwarded,
          coins: coinsAwarded,
        });
        window.dispatchEvent(new Event("gamification-stats-updated"));
      }

      toast.success(
        "Resource uploaded successfully! It will be visible to students after admin approval."
      );
      resetForm();
      onUploadSuccess?.();
      onClose();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="upload-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.section
            key="upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-resource-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#191121]"
          >
            <aside className="hidden w-1/3 flex-col justify-between bg-purple-50 p-8 dark:bg-purple-900/10 md:flex">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20">
                  <Sparkles size={24} aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Contribute
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Help build the library by sharing your notes, guides, and study material with fellow students.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                {[
                  "Supports PDF, DOC, XLS, and images",
                  "Max file size: 25 MB",
                  "List for free or earn platform coins",
                  "Community-rated and curated",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className="max-h-[85vh] flex-1 overflow-y-auto p-6 pb-20 sm:p-8">
              <header className="mb-6 flex items-center justify-between">
                <h2
                  id="upload-resource-title"
                  className="text-2xl font-bold text-slate-900 dark:text-white"
                >
                  Upload Resource
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close upload resource modal"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </header>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <BookOpen size={14} aria-hidden="true" /> Title
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-[#7C3AED]/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="e.g. Calculus II Complete Notes"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Tag size={14} aria-hidden="true" /> Subject
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={subjectOpen}
                      aria-label="Choose or create subject"
                      onClick={() => {
                        setSubjectOpen((current) => !current);
                        setSearchValue(subject);
                      }}
                      className="flex min-h-[48px] w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <span className={subject ? "" : "text-slate-400 dark:text-slate-500"}>
                        {subject || "Search or create a subject"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${
                          subjectOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {subjectOpen && (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#21172b]">
                        <div className="relative border-b border-slate-100 dark:border-white/10">
                          <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && canCreateSubject) {
                                event.preventDefault();
                                selectSubject(searchValue);
                              }
                            }}
                            placeholder="Type a subject..."
                            aria-label="Search subjects"
                            className="w-full bg-transparent py-3 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                          />
                        </div>

                        <div role="listbox" className="max-h-56 overflow-y-auto p-1">
                          {filteredSubjects.map((item) => (
                            <button
                              key={item}
                              type="button"
                              role="option"
                              aria-selected={subject === item}
                              onClick={() => selectSubject(item)}
                              className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] dark:text-slate-200"
                            >
                              {item}
                              {subject === item && (
                                <Check
                                  size={15}
                                  className="text-[#7C3AED]"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          ))}

                          {canCreateSubject && (
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              onClick={() => selectSubject(searchValue)}
                              className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-sm font-bold text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10"
                            >
                              Create &quot;{searchValue.trim()}&quot;
                            </button>
                          )}

                          {filteredSubjects.length === 0 && !canCreateSubject && (
                            <p className="px-3 py-4 text-sm text-slate-500">
                              No subjects found.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <AlignLeft size={14} aria-hidden="true" /> Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-[#7C3AED]/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="Brief description of the resource..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Coins size={14} aria-hidden="true" /> Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-[#7C3AED]/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    placeholder="0 for free, or enter coin price"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Set to 0 for a free resource.
                  </p>
                </div>

                <button
                  type="button"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose resource file"
                  className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                    isDragging
                      ? "border-[#7C3AED] bg-[#7C3AED]/5"
                      : "border-slate-300 hover:border-[#7C3AED]/60 dark:border-white/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <FileUp size={20} className="text-[#7C3AED]" aria-hidden="true" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </span>
                  ) : (
                    <>
                      <Upload
                        size={24}
                        className="mb-1 text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Drop file here or{" "}
                        <span className="font-semibold text-[#7C3AED]">browse</span>
                      </span>
                    </>
                  )}
                </button>

                {error && (
                  <p role="alert" className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={isUploading}
                  className="w-full rounded-xl bg-[#7C3AED] py-3 font-bold text-white shadow-lg shadow-purple-500/20 transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload Resource"
                  )}
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
