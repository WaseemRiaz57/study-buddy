"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ChevronLeft,
  Download,
  FileText,
  Flag,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Rocket,
  Save,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

type PopulatedUser = {
  _id: string;
  name?: string;
  image?: string;
  email?: string;
  role?: string;
};

type SessionAttachment = {
  url: string;
  name: string;
};

type MentorSessionDetail = {
  _id: string;
  studentId: PopulatedUser;
  mentorId: PopulatedUser;
  subject: string;
  scheduledAt: string;
  duration: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  roomId?: string;
  goals?: string[];
  privateNotes?: string;
  attachments?: SessionAttachment[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDownloadUrl(url: string) {
  return url.replace("/upload/", "/upload/fl_attachment/");
}

function formatSessionDate(value?: string) {
  if (!value) return "Session time TBD";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Session time TBD";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PrepRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionId = String(params.id || "");

  const [sessionDetail, setSessionDetail] = useState<MentorSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);

  const currentUserId = authSession?.user?.id || "";
  const isMentor = Boolean(
    sessionDetail?.mentorId?._id && sessionDetail.mentorId._id === currentUserId
  );
  const canLaunch =
    sessionDetail?.status === "accepted" && Boolean(sessionDetail?.roomId);

  const studentName = sessionDetail?.studentId?.name || "Student";
  const mentorName = sessionDetail?.mentorId?.name || "Mentor";
  const peerName = isMentor ? studentName : mentorName;
  const peerImage = isMentor
    ? sessionDetail?.studentId?.image
    : sessionDetail?.mentorId?.image;
  const peerInitials = getInitials(peerName) || "SB";

  const statusLabel = useMemo(() => {
    if (!sessionDetail) return "Loading";
    return sessionDetail.status.charAt(0).toUpperCase() + sessionDetail.status.slice(1);
  }, [sessionDetail]);

  useEffect(() => {
    let isActive = true;

    async function fetchSession() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load session.");
        }

        if (isActive) {
          const loadedSession = data as MentorSessionDetail;
          setSessionDetail(loadedSession);
          setGoals(loadedSession.goals ?? []);
          setPrivateNotes(loadedSession.privateNotes ?? "");
          setAttachments(loadedSession.attachments ?? []);
        }
      } catch (error) {
        if (isActive) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load session."
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    if (sessionId) {
      fetchSession();
    }

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  async function saveChanges(nextAttachments = attachments) {
    try {
      setIsSaving(true);

      const payload: {
        goals: string[];
        privateNotes?: string;
        attachments: SessionAttachment[];
      } = {
        goals: goals.map((goal) => goal.trim()).filter(Boolean),
        attachments: nextAttachments,
      };

      if (isMentor) {
        payload.privateNotes = privateNotes;
      }

      const response = await fetch(`/api/sessions/${sessionId}/prep`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save prep notes.");
      }

      const updatedSession = data as MentorSessionDetail;
      setSessionDetail(updatedSession);
      setGoals(updatedSession.goals ?? payload.goals);
      setPrivateNotes(updatedSession.privateNotes ?? privateNotes);
      setAttachments(updatedSession.attachments ?? nextAttachments);
      toast.success("Notes Saved!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save prep notes."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function addGoal() {
    const trimmedGoal = newGoal.trim();
    if (!trimmedGoal) return;

    setGoals((currentGoals) => [...currentGoals, trimmedGoal]);
    setNewGoal("");
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to upload file.");
      }

      const nextAttachments = [
        ...attachments,
        {
          url: String(result.secure_url || ""),
          name: String(result.fileName || file.name),
        },
      ];

      setAttachments(nextAttachments);
      await saveChanges(nextAttachments);
      toast.success("File uploaded to Vault.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function launchClassroom() {
    if (!canLaunch || !sessionDetail?.roomId) return;
    router.push(`/dashboard/study-rooms/${sessionDetail.roomId}`);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Loading prep room...
      </div>
    );
  }

  if (!sessionDetail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center dark:bg-slate-950">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          This session could not be loaded.
        </p>
        <Link
          href="/dashboard/sessions"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white text-slate-900 selection:bg-primary selection:text-white dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/80 lg:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sessions"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg shadow-primary/20">
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Session Prep Room
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sessionDetail.subject} - {formatSessionDate(sessionDetail.scheduledAt)}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {statusLabel}
        </span>
      </header>

      <main className="relative flex flex-grow flex-col items-center justify-center p-4 lg:p-6">
        <div className="grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 shadow-[0_4px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/60 lg:col-span-4">
            <div className="border-b border-slate-200 bg-slate-100 p-4 dark:border-white/[0.08] dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-primary to-purple-700 ring-2 ring-primary/50">
                  {peerImage ? (
                    <img
                      src={peerImage}
                      alt={peerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                      {peerInitials}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {peerName}
                  </h2>
                  <p className="text-sm text-primary/80">
                    {isMentor ? "Student" : "Mentor"} - {sessionDetail.subject}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto p-4">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Flag className="h-3.5 w-3.5" />
                  Today&apos;s Goals
                </div>
                <div className="space-y-3">
                  {goals.map((goal, index) => (
                    <div
                      key={`${index}-${goal}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 dark:bg-white/5"
                    >
                      <input
                        value={goal}
                        onChange={(event) =>
                          setGoals((currentGoals) =>
                            currentGoals.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item
                            )
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGoals((currentGoals) =>
                            currentGoals.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={newGoal}
                      onChange={(event) => setNewGoal(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addGoal();
                        }
                      }}
                      placeholder="Add a goal..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/[0.08] dark:bg-black/20"
                    />
                    <button
                      type="button"
                      onClick={addGoal}
                      className="rounded-lg bg-primary px-3 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="space-y-2">
                  {attachments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      No files shared for this session yet.
                    </div>
                  ) : (
                    attachments.map((attachment) => (
                      <a
                        key={`${attachment.url}-${attachment.name}`}
                        href={getDownloadUrl(attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        download={attachment.name}
                        className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all hover:border-primary/30 hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {attachment.name}
                          </span>
                        </div>
                        <Download className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col items-center justify-center py-10 lg:col-span-5 lg:py-0">
            <div className="mb-3 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
              <div
                className={`h-2 w-2 rounded-full ${
                  canLaunch ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {canLaunch ? "Session Ready" : "Waiting for acceptance"}
              </span>
            </div>

            <h2 className="mb-2 text-center text-4xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-5xl">
              {sessionDetail.subject}
            </h2>
            <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
              {studentName} with {mentorName}
            </p>

            <button
              type="button"
              onClick={launchClassroom}
              disabled={!canLaunch}
              className="relative flex h-14 min-w-[280px] items-center justify-center gap-4 overflow-hidden rounded-full bg-gradient-to-r from-primary to-pink-500 px-8 text-lg font-bold text-white shadow-2xl transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="relative z-10 tracking-wide">
                Launch Virtual Classroom
              </span>
              <Rocket className="relative z-10 h-6 w-6" />
            </button>

            {!canLaunch && (
              <p className="mt-3 max-w-sm text-center text-xs text-slate-500 dark:text-slate-400">
                The classroom unlocks after the mentor accepts this session and a room is assigned.
              </p>
            )}

            <div className="mt-8 flex gap-4">
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                <Mic className="h-4 w-4" />
                Check Audio
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                <Video className="h-4 w-4" />
                Test Video
              </button>
            </div>
          </section>

          <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 shadow-[0_4px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/60 lg:col-span-3">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 p-4 dark:border-white/[0.08] dark:bg-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Talking Points
              </h2>
              {isMentor && (
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  Private
                </span>
              )}
            </div>

            {isMentor ? (
              <div className="relative flex min-h-[360px] flex-grow p-4">
                <textarea
                  value={privateNotes}
                  onChange={(event) => setPrivateNotes(event.target.value)}
                  className="h-full min-h-[320px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:bg-slate-100 focus:ring-1 focus:ring-primary dark:border-white/[0.08] dark:bg-black/20 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:bg-black/30"
                  placeholder="Add private talking points for this session..."
                />
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-grow items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Private talking points are only visible to the mentor.
              </div>
            )}

            <div className="border-t border-slate-200 bg-slate-100 p-4 dark:border-white/[0.08] dark:bg-white/5">
              <button
                type="button"
                onClick={() => saveChanges()}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
