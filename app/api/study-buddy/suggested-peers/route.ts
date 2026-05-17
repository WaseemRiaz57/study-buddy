import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import StudyProfile from "@/models/StudyProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function normalizeTag(tag: unknown): string {
  return String(tag || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentObjectId = mongoose.Types.ObjectId.isValid(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    const [currentUser, currentStudentProfile] = await Promise.all([
      User.findById(currentUserId).select("subjects").lean(),
      currentObjectId
        ? StudentProfile.findOne({ userId: currentObjectId })
            .select("interestedSubjects")
            .lean()
        : null,
    ]);

    const currentTags = new Set(
      [
        ...(((currentUser?.subjects || []) as string[]) || []),
        ...(((currentStudentProfile?.interestedSubjects || []) as string[]) || []),
      ]
        .map(normalizeTag)
        .filter(Boolean)
    );

    const activeCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await User.find({
      _id: { $ne: currentUserId },
      role: "student",
      lastActive: { $gt: activeCutoff },
    })
      .select("_id name image subjects")
      .lean();

    const activeUserIds = activeUsers.map((user) => user._id);
    const [studyProfiles, studentProfiles] = await Promise.all([
      StudyProfile.find({ userId: { $in: activeUserIds.map(String) } }).lean(),
      StudentProfile.find({ userId: { $in: activeUserIds } })
        .select("userId interestedSubjects")
        .lean(),
    ]);

    const studyProfileByUserId = new Map(
      studyProfiles.map((profile) => [String(profile.userId), profile])
    );
    const studentProfileByUserId = new Map(
      studentProfiles.map((profile) => [String(profile.userId), profile])
    );

    const suggestedPeers = activeUsers
      .map((user) => {
        const userId = String(user._id);
        const studyProfile = studyProfileByUserId.get(userId);
        const studentProfile = studentProfileByUserId.get(userId);
        const tags = Array.from(
          new Set([
            ...(((studyProfile?.tags || []) as string[]) || []),
            ...(((studentProfile?.interestedSubjects || []) as string[]) || []),
            ...(((user.subjects || []) as string[]) || []),
          ].map((tag) => String(tag || "").trim()).filter(Boolean))
        );
        const sharedTags = tags.filter((tag) => currentTags.has(normalizeTag(tag)));

        return {
          userId,
          name: user.name || studyProfile?.name || "Study Buddy",
          image: user.image || studyProfile?.image || "",
          tags,
          sharedTags,
          sharedTagCount: sharedTags.length,
        };
      })
      .sort((a, b) => {
        if (b.sharedTagCount !== a.sharedTagCount) {
          return b.sharedTagCount - a.sharedTagCount;
        }

        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      peers: suggestedPeers,
    });
  } catch (error) {
    console.error("Suggested Peers Error:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching suggested peers." },
      { status: 500 }
    );
  }
}


