"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileUp,
  Sparkles,
  BookOpen,
  Tag,
  AlignLeft,
  CheckCircle2,
  Coins,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Literature",
  "History",
  "Philosophy",
  "Other",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function UploadResourceModal({ isOpen, onClose, onUploadSuccess }: UploadResourceModalProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Drag‑and‑drop handlers ---- */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!title || !file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("tags", tags);
      formData.append("price", price.trim() || "0");
      formData.append("file", file);

      const response = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Upload failed.");
      }

      toast.success(
        "Resource uploaded successfully! It will be visible to students after admin approval."
      );
      resetForm();
      onUploadSuccess?.();
      onClose();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setTags("");
    setPrice("0");
    setFile(null);
    setError(null);
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="upload-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#191121]"
          >
            {/* ---- Left decorative panel ---- */}
            <div className="w-1/3 bg-purple-50 dark:bg-purple-900/10 p-8 hidden md:flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Contribute
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                  Help build the library by sharing your notes, guides, and study material with fellow students.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Supports PDF, DOC, XLS, and images</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Max file size: 25 MB</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>List for free or earn platform coins</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Community‑rated &amp; curated</span>
                </div>
              </div>
            </div>

            {/* ---- Right form panel ---- */}
            <div className="max-h-[85vh] flex-1 overflow-y-auto p-8 pb-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Upload Resource
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <BookOpen size={14} /> Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    placeholder="e.g. Calculus II Complete Notes"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Tag size={14} /> Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                  >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <AlignLeft size={14} /> Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    placeholder="Brief description of the resource…"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Tag size={14} /> Tags
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    placeholder="Comma‑separated, e.g. calculus, midterm, notes"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Coins size={14} /> Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    placeholder="0 for free, or enter coin price"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Set to 0 for a free resource.
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#7C3AED] bg-[#7C3AED]/5"
                      : "border-slate-300 dark:border-white/20 hover:border-[#7C3AED]/60"
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
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <FileUp size={20} className="text-[#7C3AED]" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-400 dark:text-slate-500 mb-1" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Drop file here or <span className="text-[#7C3AED] font-semibold">browse</span>
                      </span>
                    </>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleUpload}
                  disabled={!title || !subject || !description || !file || isUploading}
                  className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/20"
                >
                  {isUploading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Upload Resource"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

