import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { BookOpen, CalendarDays, GraduationCap, UserRound } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { connectMongoDB } from "@/lib/mongodb";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

type ScholarPageProps = {
  params: Promise<{ id: string }>;
};

type ScholarData = {
  user: {
    id: string;
    name: string;
    image: string;
    createdAt?: Date;
  };
  profile: {
    headline: string;
    bio: string;
    academicLevel: string;
    interestedSubjects: string[];
  };
  progress: {
    xp: number;
    level: number;
  } | null;
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}

function formatJoinDate(date?: Date) {
  if (!date) return "StudyBuddy scholar";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

async function getScholarData(id: string): Promise<ScholarData | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectMongoDB();

  const user = await User.findOne({ _id: id, role: "student" })
    .select("_id name image email createdAt")
    .lean<{
      _id: mongoose.Types.ObjectId;
      name?: string;
      image?: string;
      email?: string;
      createdAt?: Date;
    }>();

  if (!user) {
    return null;
  }

  const [profile, progress] = await Promise.all([
    StudentProfile.findOne({ userId: user._id })
      .select("headline bio academicLevel interestedSubjects")
      .lean<{
        headline?: string;
        bio?: string;
        academicLevel?: string;
        interestedSubjects?: string[];
      }>(),
    UserProgress.findOne({ userId: user.email })
      .select("xp level")
      .lean<{ xp?: number; level?: number }>(),
  ]);

  return {
    user: {
      id: String(user._id),
      name: user.name || "StudyBuddy Scholar",
      image: user.image || "",
      createdAt: user.createdAt,
    },
    profile: {
      headline: profile?.headline || "StudyBuddy Scholar",
      bio: profile?.bio || "This scholar is building their learning profile on StudyBuddy.",
      academicLevel: profile?.academicLevel || "Not specified",
      interestedSubjects: profile?.interestedSubjects || [],
    },
    progress: progress
      ? {
          xp: progress.xp || 0,
          level: progress.level || 1,
        }
      : null,
  };
}

export async function generateMetadata({
  params,
}: ScholarPageProps): Promise<Metadata> {
  const { id } = await params;
  const scholar = await getScholarData(id);

  if (!scholar) {
    return {
      title: "Scholar Not Found - StudyBuddy",
      description: "This StudyBuddy scholar profile could not be found.",
    };
  }

  const subjects = scholar.profile.interestedSubjects.slice(0, 4).join(", ");
  const description = subjects
    ? `${scholar.profile.headline}. Interested in ${subjects}.`
    : scholar.profile.headline;

  return {
    title: `${scholar.user.name} - StudyBuddy Profile`,
    description,
    openGraph: {
      title: `${scholar.user.name} - StudyBuddy Profile`,
      description,
      images: scholar.user.image ? [{ url: scholar.user.image }] : undefined,
    },
  };
}

export default async function ScholarProfilePage({ params }: ScholarPageProps) {
  const { id } = await params;
  const scholar = await getScholarData(id);

  if (!scholar) {
    notFound();
  }

  const initials = getInitials(scholar.user.name);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <article className="mx-auto w-full max-w-4xl">
        <BackButton
          href="/dashboard"
          label="Return to dashboard"
          className="mb-6 border border-slate-200 bg-white text-slate-700 hover:border-purple-600 hover:text-purple-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-purple-600 bg-purple-600 text-4xl font-black text-white">
              {scholar.user.image ? (
                <Image
                  src={scholar.user.image}
                  alt={`${scholar.user.name} profile picture`}
                  width={128}
                  height={128}
                  priority
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-600">
                <UserRound size={14} aria-hidden="true" />
                Scholar Profile
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {scholar.user.name}
              </h1>
              <p className="mt-3 text-lg font-semibold text-slate-600 dark:text-slate-300">
                {scholar.profile.headline}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <CalendarDays size={16} aria-hidden="true" />
                Joined {formatJoinDate(scholar.user.createdAt)}
              </p>
            </div>
          </header>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <section
            aria-labelledby="about-scholar"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
          >
            <h2 id="about-scholar" className="text-2xl font-black">
              About
            </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600 dark:text-slate-300">
              {scholar.profile.bio}
            </p>
          </section>

          <aside className="space-y-6">
            <section
              aria-labelledby="academic-level"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white">
                <GraduationCap size={22} aria-hidden="true" />
              </div>
              <h2 id="academic-level" className="text-lg font-black">
                Academic Level
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {scholar.profile.academicLevel}
              </p>
            </section>

            {scholar.progress && (
              <section
                aria-labelledby="learning-progress"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                <h2 id="learning-progress" className="text-lg font-black">
                  Learning Progress
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <p className="text-xs font-bold uppercase text-slate-500">Level</p>
                    <p className="mt-1 text-2xl font-black text-purple-600">
                      {scholar.progress.level}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <p className="text-xs font-bold uppercase text-slate-500">XP</p>
                    <p className="mt-1 text-2xl font-black text-purple-600">
                      {scholar.progress.xp}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </section>

        <section
          aria-labelledby="subjects-of-interest"
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white">
              <BookOpen size={20} aria-hidden="true" />
            </div>
            <h2 id="subjects-of-interest" className="text-2xl font-black">
              Subjects of Interest
            </h2>
          </div>

          {scholar.profile.interestedSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {scholar.profile.interestedSubjects.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white"
                >
                  {subject}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This scholar has not added subjects yet.
            </p>
          )}
        </section>
      </article>
    </main>
  );
}

