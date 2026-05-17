import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";

export const dynamic = "force-dynamic";

type PopulatedMentorUser = {
  _id?: unknown;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type MentorProfileRecord = {
  _id: unknown;
  userId?: PopulatedMentorUser | null;
  headline?: string;
  bio?: string;
  subjects?: string[];
  hourlyRate?: number;
  certificates?: string[];
  rating?: number;
  totalReviews?: number;
  status?: string;
  isPublic?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M"
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const profiles = (await MentorProfile.find({})
      .populate({ path: "userId", select: "name email image" })
      .sort({ createdAt: -1 })
      .lean()) as MentorProfileRecord[];

    const mentorUserIds = profiles
      .map((profile) => String(profile.userId?._id || ""))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const guidedCounts = mentorUserIds.length
      ? await MentorSession.aggregate([
          {
            $match: {
              mentorId: { $in: mentorUserIds },
              status: "completed",
            },
          },
          {
            $group: {
              _id: "$mentorId",
              studentsGuided: { $sum: 1 },
            },
          },
        ])
      : [];

    const guidedCountByMentorId = new Map(
      guidedCounts.map((entry) => [String(entry._id), Number(entry.studentsGuided || 0)])
    );

    const mentors = profiles.map((profile) => {
      const user = profile.userId ?? {};
      const name = user.name || "Unknown mentor";
      const userId = String(user._id || "");

      return {
        id: String(profile._id),
        userId,
        name,
        email: user.email || "",
        image: user.image || "",
        avatar: getInitials(name),
        subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
        headline: profile.headline || "",
        bio: profile.bio || "",
        hourlyRate: Number(profile.hourlyRate || 0),
        certificates: Array.isArray(profile.certificates)
          ? profile.certificates
          : [],
        rating: Number(profile.rating || 0),
        totalReviews: Number(profile.totalReviews || 0),
        studentsGuided: guidedCountByMentorId.get(userId) || 0,
        status: profile.status || "pending",
        isPublic: Boolean(profile.isPublic),
        createdAt: profile.createdAt || null,
        updatedAt: profile.updatedAt || null,
      };
    });

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error("Fetch admin mentors error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor profiles." },
      { status: 500 }
    );
  }
}


