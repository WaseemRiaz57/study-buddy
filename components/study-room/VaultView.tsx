"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { VaultSharedFile } from "@/components/LiveVideoRoom";

type VaultViewProps = {
  senderName: string;
  sharedFiles: VaultSharedFile[];
  onShareFile: (
    file: Omit<VaultSharedFile, "id" | "senderId" | "senderName"> & {
      id?: string;
      senderName?: string;
    }
  ) => void;
};

export default function VaultView({
  senderName,
  sharedFiles,
  onShareFile,
}: VaultViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to upload file.");
      }

      onShareFile({
        url: String(result.secure_url || ""),
        name: String(result.fileName || file.name),
        format: String(result.format || file.type || "file"),
        senderName,
      });
      toast.success("File uploaded to Vault.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-100 bg-white px-4 py-3 transition-colors dark:border-white/5 dark:bg-[#130d1a]/50">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            Room Vault
          </h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#8c30e8]"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {sharedFiles.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-slate-500 transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
            <FileText className="mb-3 h-8 w-8 text-purple-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
              No files shared yet
            </p>
            <p className="mt-1 text-xs">
              Upload PDFs, images, or documents for everyone in this room.
            </p>
          </div>
        ) : (
          sharedFiles.map((file) => (
            <a
              key={`${file.url}-${file.name}`}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              download={file.name}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-purple-400/30 dark:hover:bg-purple-500/10"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm dark:bg-white/10 dark:text-purple-300">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                  {file.format.toUpperCase()} shared by {file.senderName || "Study Buddy"}
                </p>
              </div>
              <Download
                size={16}
                className="flex-shrink-0 text-slate-400 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-300"
              />
            </a>
          ))
        )}
      </div>
    </div>
  );
}
