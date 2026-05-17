"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  Eye,
  FileBadge,
  FileText,
  FileVideo,
  HardDrive,
  Library,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";

type Tab = "pending" | "published";
type ResourceStatus = "pending" | "approved" | "rejected";
type FileType = "pdf" | "video" | "doc" | "link";
type UploaderRole = "student" | "mentor" | "admin";

interface AdminResource {
  id: string;
  title: string;
  fileType: string;
  fileFormat: string;
  uploader: string;
  uploaderEmail: string;
  uploaderAvatar: string;
  uploaderRole: UploaderRole;
  subject: string;
  size: string;
  date: string;
  status: ResourceStatus;
  description: string;
  fileUrl: string;
}

interface ResourceStats {
  pendingCount: number;
  verifiedCount: number;
  storageBytes: number;
  storageUsed: string;
}

const EMPTY_STATS: ResourceStats = {
  pendingCount: 0,
  verifiedCount: 0,
  storageBytes: 0,
  storageUsed: "0.00 MB",
};

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
  student: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  mentor:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  admin: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
};

function normalizeFileType(fileType: string): FileType {
  const normalized = fileType.toLowerCase();

  if (normalized.includes("pdf")) return "pdf";
  if (normalized.includes("video") || normalized.includes("mp4")) return "video";
  if (normalized.includes("doc")) return "doc";
  return "link";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapResource(item: any): AdminResource {
  const uploaderName = item?.uploader?.name || "Unknown User";
  const fileFormat = String(item.fileType || "FILE").toUpperCase();
  const uploaderRole = String(item?.uploader?.role || "student").toLowerCase();

  return {
    id: String(item.id),
    title: item.title || "Untitled resource",
    fileType: normalizeFileType(fileFormat),
    fileFormat,
    uploader: uploaderName,
    uploaderEmail: item?.uploader?.email || "",
    uploaderAvatar: getInitials(uploaderName),
    uploaderRole:
      uploaderRole === "mentor" || uploaderRole === "admin"
        ? uploaderRole
        : "student",
    subject: item.subject || "General",
    size: item.fileSize || "0.00 MB",
    date: formatDate(item.createdAt),
    status: item.status || "pending",
    description: item.description || "",
    fileUrl: item.fileUrl || "",
  };
}

export default function ResourcesLibraryPage() {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [stats, setStats] = useState<ResourceStats>(EMPTY_STATS);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyResourceId, setBusyResourceId] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/resources", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load resources.");
      }

      const nextResources = Array.isArray(data?.resources)
        ? data.resources.map(mapResource)
        : [];

      setResources(nextResources);
      setStats({
        ...EMPTY_STATS,
        ...(data?.stats || {}),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load resources."
      );
      setResources([]);
      setStats(EMPTY_STATS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchResources();
  }, []);

  const publishedCount = resources.filter(
    (resource) => resource.status === "approved"
  ).length;
  const storagePercent = Math.min(
    Math.round((stats.storageBytes / (100 * 1024 * 1024 * 1024)) * 100),
    100
  );

  const filteredResources = useMemo(() => {
    const requiredStatus = activeTab === "pending" ? "pending" : "approved";
    const query = searchQuery.trim().toLowerCase();

    return resources.filter((resource) => {
      if (resource.status !== requiredStatus) return false;
      if (!query) return true;

      return (
        resource.title.toLowerCase().includes(query) ||
        resource.uploader.toLowerCase().includes(query) ||
        resource.uploaderEmail.toLowerCase().includes(query) ||
        resource.subject.toLowerCase().includes(query)
      );
    });
  }, [activeTab, resources, searchQuery]);

  const viewResource = (resource: AdminResource) => {
    if (!resource.fileUrl) {
      toast.error("This resource does not have a viewable file link.");
      return;
    }

    window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
  };

  const moderateResource = async (
    resource: AdminResource,
    action: "approve" | "reject"
  ) => {
    try {
      setBusyResourceId(resource.id);
      const response = await fetch(
        `/api/admin/resources/${resource.id}/action`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update resource.");
      }

      toast.success(
        data?.message ||
          (action === "approve"
            ? "Resource approved successfully."
            : "Resource rejected successfully.")
      );
      await fetchResources();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update resource."
      );
    } finally {
      setBusyResourceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          Resources Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage uploaded resources, approve submissions, and curate your
          library.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {isLoading ? "..." : stats.pendingCount}
          </p>
        </div>

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
            {isLoading ? "..." : stats.verifiedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[#7C3AED]">
              <HardDrive size={20} />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Storage Used
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {isLoading ? "..." : stats.storageUsed}
            <span className="text-sm font-normal text-purple-500 dark:text-purple-400/70">
              {" "}
              / 100 GB
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-purple-200/60 dark:bg-purple-500/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "pending"
              ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
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
            {stats.pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === "published"
              ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/25"
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

      <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 size={34} className="mb-3 animate-spin text-[#7C3AED]" />
            <p className="text-sm font-medium">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Library
              size={40}
              className="mb-3 text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm font-medium">
              No {activeTab === "pending" ? "pending" : "published"} resources
              found
            </p>
            <p className="text-xs mt-1 text-muted-foreground/60">
              {activeTab === "pending"
                ? "All caught up! No pending reviews."
                : "No published resources match your search."}
            </p>
          </div>
        ) : (
          filteredResources.map((resource) => {
            const Icon = fileTypeIcon[resource.fileType as FileType];
            const isBusy = busyResourceId === resource.id;

            return (
              <div
                key={resource.id}
                className="group grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_0.6fr_0.8fr_auto] gap-3 lg:gap-4 items-center px-6 py-4 border-b border-border/50 dark:border-white/[0.04] last:border-b-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      fileTypePill[resource.fileType as FileType]
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground dark:text-white truncate flex items-center gap-2">
                      {resource.title}
                      {resource.status === "approved" && (
                        <CheckCircle
                          size={13}
                          className="text-emerald-500 shrink-0"
                        />
                      )}
                    </p>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        fileTypePill[resource.fileType as FileType]
                      }`}
                    >
                      {resource.fileFormat}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {resource.uploaderAvatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground dark:text-white truncate">
                      {resource.uploader}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        roleBadge[resource.uploaderRole]
                      }`}
                    >
                      {resource.uploaderRole}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400">
                    {resource.subject}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{resource.size}</p>
                <p className="text-sm text-muted-foreground">{resource.date}</p>

                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => viewResource(resource)}
                    title="View"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-border dark:hover:border-white/10 transition-all"
                  >
                    <Eye size={15} />
                  </button>
                  {resource.status === "pending" && (
                    <button
                      onClick={() => void moderateResource(resource, "approve")}
                      disabled={isBusy}
                      title="Approve"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <CheckCircle size={15} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => void moderateResource(resource, "reject")}
                    disabled={isBusy}
                    title="Reject"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <XCircle size={15} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

