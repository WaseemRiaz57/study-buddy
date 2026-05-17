"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    GraduationCap,
    Star,
    XCircle,
    FileText,
    Search,
    UserCheck,
    X,
    Users,
    Clock,
    Award,
    Loader2,
} from "lucide-react";

type MentorStatus = "pending" | "approved" | "rejected" | "suspended";
type ReviewStatus = "approved" | "rejected" | "suspended";

interface MentorRecord {
    id: string;
    userId: string;
    name: string;
    email: string;
    image: string;
    avatar: string;
    subjects: string[];
    headline: string;
    bio: string;
    hourlyRate: number;
    certificates: string[];
    rating: number;
    totalReviews: number;
    studentsGuided: number;
    status: MentorStatus;
    isPublic: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

interface MentorsResponse {
    mentors?: MentorRecord[];
    message?: string;
}

function RatingDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <Star size={13} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

function formatDate(value: string | null) {
    if (!value) return "Recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatApplicationDate(value: string | null) {
    if (!value) return "Recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function getCertificateLabel(certificate: string, index: number) {
    if (certificate.startsWith("data:application/pdf")) return `Certificate ${index + 1}.pdf`;
    if (certificate.startsWith("data:image")) return `Certificate ${index + 1} image`;
    return certificate || `Certificate ${index + 1}`;
}

function viewCertificate(certificate: string, index: number) {
    if (!certificate) return;

    if (certificate.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = certificate;
        link.download = getCertificateLabel(certificate, index).replace(/\s+/g, "_");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }

    window.open(certificate, "_blank", "noopener,noreferrer");
}

export default function MentorManagementPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [mentors, setMentors] = useState<MentorRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewModal, setReviewModal] = useState<MentorRecord | null>(null);
    const [actionKey, setActionKey] = useState("");

    const fetchMentors = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/mentors", {
                cache: "no-store",
            });
            const data = (await response.json().catch(() => null)) as
                | MentorsResponse
                | null;

            if (!response.ok) {
                throw new Error(data?.message || "Failed to load mentors.");
            }

            setMentors(Array.isArray(data?.mentors) ? data.mentors : []);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to load mentors."
            );
            setMentors([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        void fetchMentors();
    }, [fetchMentors]);

    const activeMentors = useMemo(
        () => mentors.filter((mentor) => mentor.status === "approved"),
        [mentors]
    );

    const pendingApplications = useMemo(
        () => mentors.filter((mentor) => mentor.status === "pending"),
        [mentors]
    );

    const averageRating =
        activeMentors.length > 0
            ? activeMentors.reduce((sum, mentor) => sum + mentor.rating, 0) /
              activeMentors.length
            : 0;

    const filteredMentors = activeMentors.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const filteredApplications = pendingApplications.filter(
        (a) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.subjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const handleStatusUpdate = async (mentor: MentorRecord, status: ReviewStatus) => {
        const nextActionKey = `${mentor.id}-${status}`;

        try {
            setActionKey(nextActionKey);
            const response = await fetch(`/api/admin/mentors/${mentor.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = (await response.json().catch(() => null)) as
                | { message?: string }
                | null;

            if (!response.ok) {
                throw new Error(data?.message || "Failed to update mentor status.");
            }

            toast.success(data?.message || "Mentor status updated.");
            setReviewModal(null);
            await fetchMentors();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to update mentor status."
            );
        } finally {
            setActionKey("");
        }
    };

    const handleRevokeStatus = async (mentor: MentorRecord) => {
        const confirmed = window.confirm(
            `Revoke ${mentor.name}'s mentor status? Their public profile will be hidden.`
        );

        if (!confirmed) return;

        await handleStatusUpdate(mentor, "suspended");
    };

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-600 dark:bg-purple-500/15 dark:border-purple-500/25 dark:text-purple-400">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Mentor Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Review mentor applications and manage active platform educators.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Active Mentors
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {activeMentors.length}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Pending Applications
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {pendingApplications.length}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border p-4 bg-yellow-50/60 border-yellow-200 dark:bg-yellow-500/[0.08] dark:border-yellow-500/20">
                    <div className="text-yellow-500 dark:text-yellow-400 shrink-0">
                        <Star size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Average Rating
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                            {averageRating.toFixed(1)}
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 w-fit">
                    {(
                        [
                            { key: "active", label: "Active Mentors", count: activeMentors.length },
                            {
                                key: "pending",
                                label: "Pending Applications",
                                count: pendingApplications.length,
                            },
                        ] as const
                    ).map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                {tab.label}
                                <span
                                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-200 text-slate-500 dark:bg-white/[0.06] dark:text-slate-500"
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    />
                    <input
                        type="text"
                        placeholder="Search mentors or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === "active" ? (
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Mentor
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Subject Expertise
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Rating
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Students Guided
                                    </th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-[#7C3AED]" />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                Loading mentors...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredMentors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <GraduationCap
                                                size={36}
                                                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                            />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                No mentors found.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMentors.map((mentor) => (
                                        <tr
                                            key={mentor.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                                        {mentor.image ? (
                                                            <img src={mentor.image} alt={mentor.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            mentor.avatar
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {mentor.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                            Since {formatDate(mentor.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {mentor.subjects.map((s) => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {mentor.subjects.length === 0 && (
                                                        <span className="text-xs text-slate-400">No subjects</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <RatingDisplay rating={mentor.rating} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={13} className="text-slate-400 dark:text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {mentor.studentsGuided}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleRevokeStatus(mentor)}
                                                        disabled={Boolean(actionKey)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {actionKey === `${mentor.id}-suspended` ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <XCircle size={12} />
                                                        )}
                                                        Revoke Status
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[750px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Applicant
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Requested Subjects
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Experience
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Applied
                                    </th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-5 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-[#7C3AED]" />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                Loading applications...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16">
                                            <FileText
                                                size={36}
                                                className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                            />
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                                No pending applications.
                                            </p>
                                            <p className="text-xs text-slate-400/60 dark:text-slate-500/60 mt-1">
                                                All caught up! No applications awaiting review.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            className="border-b last:border-b-0 border-b-slate-100 dark:border-b-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                                        {app.image ? (
                                                            <img src={app.image} alt={app.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            app.avatar
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {app.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {app.email || "No email provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {app.subjects.map((s) => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {app.subjects.length === 0 && (
                                                        <span className="text-xs text-slate-400">No subjects</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] truncate">
                                                    {app.headline || app.bio || "No experience summary provided."}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {formatApplicationDate(app.createdAt)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setReviewModal(app)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
                                                    >
                                                        <FileText size={12} /> Review
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {activeTab === "active"
                        ? `${filteredMentors.length} active mentors`
                        : `${filteredApplications.length} pending applications`}
                </span>
                <span>StudyBuddy Admin · Mentor Panel</span>
            </div>

            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setReviewModal(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                    {reviewModal.image ? (
                                        <img src={reviewModal.image} alt={reviewModal.name} className="h-full w-full object-cover" />
                                    ) : (
                                        reviewModal.avatar
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Application from {reviewModal.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {reviewModal.email || "No email provided"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReviewModal(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                                        <GraduationCap size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Applicant Details
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                            Requested Subjects
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {reviewModal.subjects.map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                            {reviewModal.subjects.length === 0 && (
                                                <span className="text-xs text-slate-400">No subjects listed</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                            Hourly Rate
                                        </label>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            {reviewModal.hourlyRate} Coins/hr
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                    Professional Experience
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                    {reviewModal.headline || "No experience headline provided."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                        <Award size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Full Bio
                                    </h4>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-500/[0.04] rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/10">
                                    {reviewModal.bio || "No bio provided."}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                                        <FileText size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Attached Credentials
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    {reviewModal.certificates.length === 0 ? (
                                        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06] text-sm text-slate-400">
                                            No certificates attached.
                                        </div>
                                    ) : (
                                        reviewModal.certificates.map((certificate, index) => (
                                            <div
                                                key={`${reviewModal.id}-certificate-${index}`}
                                                className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                                                    <FileText size={18} className="text-red-500 dark:text-red-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {getCertificateLabel(certificate, index)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                        {certificate.startsWith("data:") ? "Uploaded Base64 document" : "External document"}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => viewCertificate(certificate, index)}
                                                    className="text-[11px] font-semibold text-[#7C3AED] hover:underline whitespace-nowrap"
                                                >
                                                    View File
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => void handleStatusUpdate(reviewModal, "rejected")}
                                disabled={Boolean(actionKey)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {actionKey === `${reviewModal.id}-rejected` ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                Reject
                            </button>

                            <button
                                onClick={() => void handleStatusUpdate(reviewModal, "approved")}
                                disabled={Boolean(actionKey)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-[#7C3AED] text-white shadow-md shadow-purple-500/30 hover:opacity-90 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {actionKey === `${reviewModal.id}-approved` ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <UserCheck size={14} />
                                )}
                                Approve Mentor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

