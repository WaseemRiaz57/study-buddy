import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import {
  Award,
  BookOpen,
  Clock,
  Crown,
  Flame,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { connectMongoDB } from "@/lib/mongodb";
import Badge from "@/models/Badge";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserBadge from "@/models/UserBadge";
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
  badges: {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "legendary";
    earnedAt: Date | null;
  }[];
};

const BADGE_ICONS: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  Clock,
  Crown,
  Flame,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
};

// Rarity reads through the ring colour: legendary gets the highlighter.
const badgeRarityStyles = {
  common: "border-[var(--lamp-rule-strong)] text-[var(--lamp-graphite)]",
  rare: "border-[var(--lamp-paper)]/60 text-[var(--lamp-paper)]",
  legendary: "border-[var(--lamp-marker)] bg-[var(--lamp-marker)] text-[var(--lamp-ink)]",
} satisfies Record<"common" | "rare" | "legendary", string>;

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
  if (!date) return "Recently";

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

  const [profile, progress, earnedBadges] = await Promise.all([
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
    UserBadge.find({ userId: user._id })
      .sort({ earnedAt: -1 })
      .limit(6)
      .populate({
        path: "badgeId",
        model: Badge,
        select: "title description icon rarity",
      })
      .lean<
        {
          _id: mongoose.Types.ObjectId;
          earnedAt?: Date;
          badgeId?: {
            _id: mongoose.Types.ObjectId;
            title?: string;
            description?: string;
            icon?: string;
            rarity?: "common" | "rare" | "legendary";
          };
        }[]
      >(),
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
    badges: earnedBadges
      .filter((row) => row.badgeId)
      .map((row) => ({
        id: String(row.badgeId?._id || row._id),
        title: row.badgeId?.title || "Achievement",
        description: row.badgeId?.description || "",
        icon: row.badgeId?.icon || "Award",
        rarity: row.badgeId?.rarity || "common",
        earnedAt: row.earnedAt || null,
      })),
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
    <article className="pt-[calc(4.5rem+clamp(3rem,8vw,6rem))]">
      <header className="lamp-wrap">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
          <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--lamp-paper)] text-[var(--lamp-ink)] sm:h-36 sm:w-36">
            {scholar.user.image ? (
              <Image
                src={scholar.user.image}
                alt={`${scholar.user.name} profile picture`}
                width={144}
                height={144}
                priority
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="lamp-serif text-4xl">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="lamp-display !text-[clamp(2.75rem,6vw,5rem)]">{scholar.user.name}</h1>
            <p className="lamp-lead mt-4">{scholar.profile.headline}</p>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-y-6 border-y border-[var(--lamp-rule)] py-6 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-[var(--lamp-graphite)]">Studying at</dt>
            <dd className="lamp-serif mt-1 text-xl">{scholar.profile.academicLevel}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--lamp-graphite)]">Member since</dt>
            <dd className="lamp-serif mt-1 text-xl">{formatJoinDate(scholar.user.createdAt)}</dd>
          </div>
          {scholar.progress && (
            <>
              <div>
                <dt className="text-sm text-[var(--lamp-graphite)]">Level</dt>
                <dd className="lamp-serif mt-1 text-xl">{scholar.progress.level}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--lamp-graphite)]">XP</dt>
                <dd className="lamp-serif mt-1 text-xl tabular-nums">{scholar.progress.xp.toLocaleString("en")}</dd>
              </div>
            </>
          )}
        </dl>
      </header>

      <div className="lamp-wrap grid gap-16 py-[clamp(4rem,10vw,7rem)] lg:grid-cols-12">
        <section aria-labelledby="about-scholar" className="lg:col-span-7">
          <h2 id="about-scholar" className="lamp-h3">
            About
          </h2>
          <p className="mt-4 max-w-[38rem] whitespace-pre-line text-[1.05rem] leading-[1.7] text-[var(--lamp-paper)]/85">
            {scholar.profile.bio}
          </p>

          <h2 id="subjects-of-interest" className="lamp-h3 mt-14">
            Subjects
          </h2>
          {scholar.profile.interestedSubjects.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-labelledby="subjects-of-interest">
              {scholar.profile.interestedSubjects.map((subject) => (
                <li key={subject} className="lamp-chip">
                  {subject}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[var(--lamp-graphite)]">No subjects added yet.</p>
          )}
        </section>

        <section aria-labelledby="recent-achievements" className="lg:col-span-5">
          <h2 id="recent-achievements" className="lamp-h3">
            Recent badges
          </h2>
          {scholar.badges.length > 0 ? (
            <ul className="mt-4">
              {scholar.badges.map((badge) => {
                const Icon = BADGE_ICONS[badge.icon] || Award;
                return (
                  <li key={badge.id} className="lamp-row flex gap-4 py-5">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${badgeRarityStyles[badge.rarity]}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {badge.title}
                        <span className="ml-2 text-sm capitalize text-[var(--lamp-graphite)]">{badge.rarity}</span>
                      </p>
                      {badge.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--lamp-graphite)]">{badge.description}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-[var(--lamp-graphite)]">No public badges yet.</p>
          )}
        </section>
      </div>
    </article>
  );
}
