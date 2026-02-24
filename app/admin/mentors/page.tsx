"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    GraduationCap,
    Star,
    CheckCircle,
    XCircle,
    FileText,
    Search,
    UserCheck,
    X,
    Users,
    Clock,
    Award,
    ShieldCheck,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface ActiveMentor {
    id: string;
    name: string;
    avatar: string;
    subjects: string[];
    rating: number;
    studentsGuided: number;
    joinedDate: string;
}

interface PendingApplication {
    id: string;
    name: string;
    email: string;
    avatar: string;
    requestedSubjects: string[];
    experience: string;
    motivation: string;
    credentials: string;
    applicationDate: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────
const ACTIVE_MENTORS: ActiveMentor[] = [
    {
        id: "m1",
        name: "Dr. Sarah Chen",
        avatar: "SC",
        subjects: ["Machine Learning", "Data Science"],
        rating: 4.9,
        studentsGuided: 142,
        joinedDate: "Sep 2024",
    },
    {
        id: "m2",
        name: "Prof. James Miller",
        avatar: "JM",
        subjects: ["Web Development", "React", "Node.js"],
        rating: 4.7,
        studentsGuided: 98,
        joinedDate: "Nov 2024",
    },
    {
        id: "m3",
        name: "Aisha Patel",
        avatar: "AP",
        subjects: ["Mathematics", "Linear Algebra"],
        rating: 4.8,
        studentsGuided: 67,
        joinedDate: "Jan 2025",
    },
];

const PENDING_APPLICATIONS: PendingApplication[] = [
    {
        id: "p1",
        name: "Carlos Rivera",
        email: "carlos.r@university.edu",
        avatar: "CR",
        requestedSubjects: ["HCI", "UX Research"],
        experience:
            "5 years as a UX researcher at Google, published 3 papers on human-computer interaction methodologies. Previously taught as an adjunct professor for 2 semesters at UC Berkeley.",
        motivation:
            "I'm passionate about mentoring the next generation of UX practitioners. Having transitioned from academia to industry, I understand the challenges students face and want to bridge that gap. I believe in hands-on, project-based learning and would love to guide students through real-world design challenges.",
        credentials: "PhD_HCI_Thesis_Rivera.pdf",
        applicationDate: "2 days ago",
    },
    {
        id: "p2",
        name: "Maria Gonzalez",
        email: "maria.g@techmail.com",
        avatar: "MG",
        requestedSubjects: ["Physics", "Quantum Computing"],
        experience:
            "Research scientist at CERN for 3 years, Master's in Theoretical Physics from MIT. Mentored 12 undergraduate students through thesis projects and lab rotations.",
        motivation:
            "Physics can be intimidating for many students, but I believe the right mentor can make complex topics accessible and exciting. I want to share my research experience and help students develop critical thinking skills that extend beyond the classroom.",
        credentials: "Research_Portfolio_Gonzalez.pdf",
        applicationDate: "4 days ago",
    },
    {
        id: "p3",
        name: "David Kim",
        email: "d.kim@devstudio.io",
        avatar: "DK",
        requestedSubjects: ["Web Development", "TypeScript"],
        experience:
            "Senior full-stack developer with 8 years at Shopify and Stripe. Open-source contributor to Next.js and TypeScript compiler. Conducted 20+ workshops at tech conferences.",
        motivation:
            "I've benefited enormously from mentors throughout my career and want to pay it forward. I specialize in making complex architectural concepts understandable and love helping developers level up from intermediate to senior. My teaching style is collaborative — I prefer pairing sessions over lectures.",
        credentials: "Workshop_Speaker_Portfolio_Kim.pdf",
        applicationDate: "1 week ago",
    },
];

// ─── Rating Stars Component ────────────────────────────────────────────────────
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

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function MentorManagementPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [reviewModal, setReviewModal] = useState<PendingApplication | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-[60vh]" />;
    }

    const filteredMentors = ACTIVE_MENTORS.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    const filteredApplications = PENDING_APPLICATIONS.filter(
        (a) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.requestedSubjects.some((s) =>
                s.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );

    return (
        <div className="space-y-6">
            {/* ════════ HEADER ════════ */}
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

            {/* ════════ STAT CARDS ════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Active Mentors */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-purple-50/60 border-purple-200 dark:bg-purple-500/[0.08] dark:border-purple-500/20">
                    <div className="text-purple-500 dark:text-purple-400 shrink-0">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Active Mentors
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {ACTIVE_MENTORS.length}
                        </div>
                    </div>
                </div>

                {/* Pending Applications */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-orange-50/60 border-orange-200 dark:bg-orange-500/[0.08] dark:border-orange-500/20">
                    <div className="text-orange-500 dark:text-orange-400 shrink-0">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            Pending Applications
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {PENDING_APPLICATIONS.length}
                        </div>
                    </div>
                </div>

                {/* Average Rating */}
                <div className="flex items-center gap-4 rounded-xl border p-4 bg-yellow-50/60 border-yellow-200 dark:bg-yellow-500/[0.08] dark:border-yellow-500/20">
                    <div className="text-yellow-500 dark:text-yellow-400 shrink-0">
                        <Star size={22} />
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                            Average Rating
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                            {(
                                ACTIVE_MENTORS.reduce((sum, m) => sum + m.rating, 0) /
                                ACTIVE_MENTORS.length
                            ).toFixed(1)}
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════ TABS + SEARCH ════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Tabs */}
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 w-fit">
                    {(
                        [
                            { key: "active", label: "Active Mentors", count: ACTIVE_MENTORS.length },
                            {
                                key: "pending",
                                label: "Pending Applications",
                                count: PENDING_APPLICATIONS.length,
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

                {/* Search */}
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

            {/* ════════ DATA TABLE ════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === "active" ? (
                        /* ──── Active Mentors Table ──── */
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
                                {filteredMentors.length === 0 ? (
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
                                            {/* Mentor Info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {mentor.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {mentor.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                            Since {mentor.joinedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subjects */}
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
                                                </div>
                                            </td>

                                            {/* Rating */}
                                            <td className="px-5 py-4">
                                                <RatingDisplay rating={mentor.rating} />
                                            </td>

                                            {/* Students */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={13} className="text-slate-400 dark:text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {mentor.studentsGuided}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/30 transition-all whitespace-nowrap">
                                                        <XCircle size={12} /> Revoke Status
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* ──── Pending Applications Table ──── */
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
                                {filteredApplications.length === 0 ? (
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
                                            {/* Applicant */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {app.avatar}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {app.name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                            {app.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Requested Subjects */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {app.requestedSubjects.map((s) => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Experience (truncated) */}
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] truncate">
                                                    {app.experience}
                                                </p>
                                            </td>

                                            {/* Application Date */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {app.applicationDate}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => setReviewModal(app)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all whitespace-nowrap"
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

            {/* ════════ FOOTER ════════ */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>
                    {activeTab === "active"
                        ? `${filteredMentors.length} active mentors`
                        : `${filteredApplications.length} pending applications`}
                </span>
                <span>StudyBuddy Admin · Mentor Panel</span>
            </div>

            {/* ════════ APPLICATION REVIEW MODAL ════════ */}
            {reviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setReviewModal(null)}
                >
                    <div
                        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a0f26] shadow-2xl max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {reviewModal.avatar}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Application from {reviewModal.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                        {reviewModal.email}
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

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Applicant Details */}
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
                                            {reviewModal.requestedSubjects.map((s) => (
                                                <span
                                                    key={s}
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/25"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                            Applied
                                        </label>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Clock size={13} className="text-slate-400" />
                                            {reviewModal.applicationDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                                    Professional Experience
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3 border border-slate-200 dark:border-white/[0.06]">
                                    {reviewModal.experience}
                                </p>
                            </div>

                            {/* Motivation */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                        <Award size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Why I Want to Be a Mentor
                                    </h4>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-500/[0.04] rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/10">
                                    {reviewModal.motivation}
                                </p>
                            </div>

                            {/* Credentials */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                                        <FileText size={14} />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Attached Credentials
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3 border border-slate-200 dark:border-white/[0.06]">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                                        <FileText size={18} className="text-red-500 dark:text-red-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {reviewModal.credentials}
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                            PDF Document · 2.4 MB
                                        </p>
                                    </div>
                                    <button className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap">
                                        View File
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Action Buttons */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <XCircle size={14} /> Reject
                            </button>

                            <button
                                onClick={() => setReviewModal(null)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
                            >
                                <UserCheck size={14} /> Approve Mentor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
