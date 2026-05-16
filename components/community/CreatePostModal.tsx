"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader2, Plus, Tag, UploadCloud, X } from "lucide-react";

interface CreatePostPayload {
  title: string;
  body: string;
  category: string;
  tags: string[];
  files: File[];
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (payload: CreatePostPayload) => Promise<void> | void;
  categories?: string[];
  isPublishing?: boolean;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPublish,
  categories = [],
  isPublishing = false,
}: CreatePostModalProps) {
  const categoryOptions = categories.filter((category) => category !== "All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(
    categoryOptions[0] || "General"
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const canPublish = useMemo(
    () =>
      title.trim().length > 2 &&
      body.trim().length > 8 &&
      category.trim().length > 0,
    [title, body, category]
  );

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, "");
    if (!clean || tags.includes(clean)) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, clean].slice(0, 8));
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((item) => item !== tag));

  const onSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;

    setFiles((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((file) => file.name !== name));

  const resetForm = () => {
    setTitle("");
    setBody("");
    setCategory(categoryOptions[0] || "General");
    setTagInput("");
    setTags([]);
    setFiles([]);
  };

  const publish = async () => {
    if (!canPublish || isPublishing) return;

    await onPublish?.({
      title: title.trim(),
      body: body.trim(),
      category: category.trim(),
      tags,
      files,
    });

    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-post-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#191121] md:flex-row"
          >
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Share Wisdom
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Topic title..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none placeholder-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    {categoryOptions.length > 0 ? (
                      categoryOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))
                    ) : (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write here... Markdown supported."
                    className="mt-2 h-40 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none placeholder-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Tags
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"
                      />
                      <input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add tag and press Enter"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pl-9 text-slate-900 outline-none placeholder-slate-400 focus:border-[#7C3AED] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded-full bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] hover:opacity-80 dark:bg-[#7C3AED]/20"
                        >
                          #{tag} x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Attachments
                  </label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-[#7C3AED]/50 dark:border-white/15 dark:bg-white/5"
                  >
                    <UploadCloud
                      size={24}
                      className="mx-auto mb-2 text-slate-400 dark:text-gray-500"
                    />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Drag and drop or click to upload
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      PDF, images, notes
                    </p>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onSelectFiles}
                  />
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-[#1e1629]"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText
                              size={14}
                              className="shrink-0 text-slate-500 dark:text-gray-400"
                            />
                            <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(file.name)}
                            className="text-xs text-slate-500 transition-colors hover:text-red-500 dark:text-gray-400"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void publish()}
                  disabled={!canPublish || isPublishing}
                  className="w-full rounded-xl bg-[#7C3AED] py-3 font-bold text-white shadow-lg shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
                >
                  {isPublishing ? (
                    <Loader2 className="mx-auto animate-spin" size={18} />
                  ) : (
                    "Publish Post"
                  )}
                </button>
              </div>
            </div>

            <aside className="hidden w-full flex-col border-t border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5 md:flex md:w-80 md:border-l md:border-t-0">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Live Preview
              </h3>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#1e1629]">
                <span className="mb-2 inline-flex rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7C3AED]">
                  {category}
                </span>
                <h4 className="mb-2 line-clamp-2 font-bold text-slate-900 dark:text-white">
                  {title || "Your title will appear here"}
                </h4>
                <p className="line-clamp-5 text-sm text-slate-600 dark:text-gray-300">
                  {body || "Post body preview..."}
                </p>
              </div>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7C3AED] dark:bg-[#7C3AED]/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-6">
                <button
                  onClick={() => void publish()}
                  disabled={!canPublish || isPublishing}
                  className="w-full rounded-xl bg-[#7C3AED] py-3 font-bold text-white shadow-lg shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPublishing ? (
                    <Loader2 className="mx-auto animate-spin" size={18} />
                  ) : (
                    "Publish Post"
                  )}
                </button>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
