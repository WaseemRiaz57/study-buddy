"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, UploadCloud, Plus, Tag, FileText } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CreatePostPayload {
  title: string;
  body: string;
  tags: string[];
  files: File[];
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (payload: CreatePostPayload) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function CreatePostModal({ isOpen, onClose, onPublish }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const canPublish = useMemo(
    () => title.trim().length > 2 && body.trim().length > 8,
    [title, body]
  );

  const addTag = () => {
    const clean = tagInput.trim();
    if (!clean || tags.includes(clean)) { setTagInput(""); return; }
    setTags((prev) => [...prev, clean]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const publish = () => {
    if (!canPublish) return;
    onPublish?.({ title: title.trim(), body: body.trim(), tags, files });
    setTitle(""); setBody(""); setTagInput(""); setTags([]); setFiles([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-post-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white border-slate-200 dark:bg-[#191121]/85 dark:border-white/10"
          >
            {/* LEFT: Form */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-purple-600 dark:text-[#8c30e8]" size={26} />
                  Share Wisdom
                </h2>
                <button onClick={onClose} className="p-2 rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Topic title..."
                    className="mt-2 w-full p-3 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write here... Markdown supported."
                    className="mt-2 w-full h-40 p-4 rounded-xl border outline-none resize-none bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8] dark:focus:ring-[#8c30e8]/20"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Tags</label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag and press Enter"
                        className="w-full pl-9 p-3 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-[#8c30e8]"
                      />
                    </div>
                    <button type="button" onClick={addTag} className="px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button key={tag} type="button" onClick={() => removeTag(tag)} className="px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-80 bg-purple-100 text-purple-700 dark:bg-[#8c30e8]/20 dark:text-[#8c30e8]">
                          #{tag} ✕
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Attachments</label>
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors border-slate-300 bg-slate-50 hover:border-purple-500/40 dark:border-white/15 dark:bg-white/5 dark:hover:border-[#8c30e8]/40">
                    <UploadCloud size={24} className="mx-auto mb-2 text-slate-400 dark:text-gray-500" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag &amp; drop or click to upload</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">PDF, images, notes</p>
                  </button>
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onSelectFiles} />
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file) => (
                        <div key={file.name} className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-slate-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm truncate text-slate-700 dark:text-slate-200">{file.name}</span>
                          </div>
                          <button onClick={() => removeFile(file.name)} className="text-xs text-slate-500 dark:text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile publish */}
                <button onClick={publish} disabled={!canPublish} className="md:hidden group relative w-full py-3 rounded-xl font-bold text-white overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="relative z-10">Publish Post</span>
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md translate-x-0 group-hover:translate-x-[340%] transition-transform duration-700" />
                </button>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l p-6 hidden md:flex flex-col bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-4">Live Preview</h3>
              <div className="p-4 rounded-xl border shadow-sm bg-white border-slate-200 dark:bg-[#1e1629] dark:border-white/5">
                <h4 className="font-bold mb-2 line-clamp-2 text-slate-900 dark:text-white">{title || "Your title will appear here"}</h4>
                <p className="text-sm line-clamp-5 text-slate-600 dark:text-gray-300">{body || "Post body preview..."}</p>
              </div>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-6">
                <button onClick={publish} disabled={!canPublish} className="group relative w-full py-3 rounded-xl font-bold text-white overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="relative z-10">Publish Post</span>
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md translate-x-0 group-hover:translate-x-[340%] transition-transform duration-700" />
                </button>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
