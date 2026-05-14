"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type ReviewStatus = "approved" | "rejected";

type PendingMentorApplication = {
  id: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  headline: string;
  bio: string;
  subjects: string[];
  hourlyRate: number;
  certificates: string[];
  createdAt: string | null;
};

type PendingMentorsResponse = {
  applications?: PendingMentorApplication[];
  message?: string;
};

function isUploadedCertificate(certificate: string) {
  return (
    certificate.startsWith("data:image") ||
    certificate.startsWith("data:application")
  );
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "M";
}

function formatSubmittedDate(value: string | null) {
  if (!value) return "Recently submitted";

  const submittedDate = new Date(value);

  if (Number.isNaN(submittedDate.getTime())) {
    return "Recently submitted";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(submittedDate);
}

function openUploadedCertificate(certificate: string) {
  const certificateWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!certificateWindow) {
    toast.error("Allow pop-ups to view this document.");
    return;
  }

  certificateWindow.location.href = certificate;
}

function MentorCardSkeleton() {
  return (
    <article className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/5" />
        <div className="h-3 w-11/12 rounded-full bg-slate-100 dark:bg-white/5" />
        <div className="h-3 w-4/6 rounded-full bg-slate-100 dark:bg-white/5" />
      </div>
      <div className="mt-6 h-16 rounded-xl bg-slate-100 dark:bg-white/5" />
      <div className="mt-6 flex gap-3">
        <div className="h-11 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-11 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
      </div>
    </article>
  );
}

export default function PendingMentorsPage() {
  const [applications, setApplications] = useState<PendingMentorApplication[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchPendingMentors() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/mentors/pending", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | PendingMentorsResponse
          | null;

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load pending mentor applications."
          );
        }

        if (active) {
          setApplications(data?.applications ?? []);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load pending mentor applications."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchPendingMentors();

    return () => {
      active = false;
    };
  }, []);

  const handleStatusUpdate = async (id: string, status: ReviewStatus) => {
    const nextActionKey = `${id}-${status}`;

    try {
      setActionKey(nextActionKey);
      const response = await fetch(`/api/admin/mentors/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update application.");
      }

      setApplications((current) =>
        current.filter((application) => application.id !== id)
      );
      toast.success(
        status === "approved"
          ? "Mentor application approved."
          : "Mentor application rejected."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update application."
      );
    } finally {
      setActionKey("");
    }
  };

  return (
    <main className="max-w-full space-y-6 overflow-hidden p-5 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 text-[#7C3AED] dark:border-purple-500/30 dark:bg-purple-500/10">
            <GraduationCap size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black text-slate-900 dark:text-white">
              Pending Mentor Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review submitted mentor profiles before they become public.
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
          <ShieldCheck size={16} className="text-[#7C3AED]" aria-hidden="true" />
          {isLoading ? "Loading" : `${applications.length} pending`}
        </div>
      </header>

      {isLoading ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <MentorCardSkeleton key={item} />
          ))}
        </section>
      ) : applications.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 text-[#7C3AED] dark:border-purple-500/30 dark:bg-purple-500/10">
            <CheckCircle2 size={26} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            No pending applications
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Every submitted mentor profile has been reviewed.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => {
            const approveKey = `${application.id}-approved`;
            const rejectKey = `${application.id}-rejected`;

            return (
              <article
                key={application.id}
                className="flex min-h-[520px] max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] text-sm font-black text-white">
                    {application.applicant.image ? (
                      <Image
                        src={application.applicant.image}
                        alt={`${application.applicant.name} profile image`}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(application.applicant.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-slate-900 dark:text-white">
                      {application.applicant.name}
                    </h2>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Mail size={13} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {application.applicant.email || "No email provided"}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      Submitted {formatSubmittedDate(application.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 min-w-0 flex-1 space-y-5">
                  <section>
                    <p className="text-xs font-black uppercase text-slate-400">
                      Headline
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">
                      {application.headline || "No headline provided"}
                    </p>
                  </section>

                  <section>
                    <p className="text-xs font-black uppercase text-slate-400">
                      Bio
                    </p>
                    <p
                      className="mt-1 overflow-hidden break-words text-sm leading-6 text-slate-600 dark:text-slate-300"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {application.bio || "No bio provided."}
                    </p>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Requested Hourly Rate
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {application.hourlyRate} Coins/hr
                    </p>
                  </section>

                  <section>
                    <p className="text-xs font-black uppercase text-slate-400">
                      Subjects
                    </p>
                    <div className="mt-2 flex min-h-[28px] flex-wrap gap-2">
                      {application.subjects.length > 0 ? (
                        application.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="max-w-full truncate rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#7C3AED] dark:border-purple-500/30 dark:bg-purple-500/10"
                          >
                            {subject}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          No subjects listed
                        </span>
                      )}
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-black uppercase text-slate-400">
                      Certificates
                    </p>
                    <div className="mt-2 grid gap-2">
                      {application.certificates.length > 0 ? (
                        application.certificates.map((certificate, index) =>
                          isUploadedCertificate(certificate) ? (
                            <button
                              key={`${application.id}-document-${index}`}
                              type="button"
                              onClick={() => openUploadedCertificate(certificate)}
                              className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-[#7C3AED] transition-colors hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20"
                            >
                              <FileText size={14} aria-hidden="true" />
                              View Document
                            </button>
                          ) : (
                            <a
                              key={`${application.id}-certificate-${index}`}
                              href={certificate}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#7C3AED] transition-colors hover:bg-purple-50 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-purple-500/10"
                            >
                              <span className="inline-flex min-w-0 max-w-full items-center gap-2">
                                <ExternalLink
                                  size={13}
                                  className="shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="block truncate">
                                  {certificate}
                                </span>
                              </span>
                            </a>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-400">
                          No certificates attached
                        </span>
                      )}
                    </div>
                  </section>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      void handleStatusUpdate(application.id, "approved")
                    }
                    disabled={Boolean(actionKey)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-black text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionKey === approveKey ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleStatusUpdate(application.id, "rejected")
                    }
                    disabled={Boolean(actionKey)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 text-sm font-black text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionKey === rejectKey ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
