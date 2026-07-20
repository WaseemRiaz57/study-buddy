import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";
import { isMentorRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = String(id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
    }

    await connectMongoDB();

    const user = await User.findById(userId)
      .select("_id name image profileImage subjects email role createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const normalizedRole = isMentorRole(user.role) ? "mentor" : "student";

    const ProfileModel = normalizedRole === "mentor" ? MentorProfile : StudentProfile;
    const profileSelect =
      normalizedRole === "mentor"
        ? "bio headline subjects xp subscriptionTier academicLevel rating totalReviews status"
        : "bio headline interestedSubjects xp subscriptionTier academicLevel";

    const [profile, progress] = await Promise.all([
      ProfileModel.findOne({ userId: user._id }).select(profileSelect).lean(),
      UserProgress.findOne({
        $or: [{ userId }, { userId: String(user.email || "").toLowerCase() }],
      })
        .select("xp level")
        .lean(),
    ]);

    const preferredSubjects = Array.from(
      new Set([
        ...(((profile as any)?.interestedSubjects || []) as string[]),
        ...(((profile as any)?.subjects || []) as string[]),
        ...((user.subjects || []) as string[]),
      ].map((subject) => String(subject || "").trim()).filter(Boolean))
    ).slice(0, 12);

    const xp = Number((profile as any)?.xp ?? progress?.xp ?? 0);
    const level = Number(progress?.level ?? Math.max(1, Math.floor(xp / 250) + 1));
    const badges = [
      (profile as any)?.subscriptionTier,
      (profile as any)?.academicLevel,
      normalizedRole === "mentor" ? "Mentor" : null,
      (profile as any)?.status === "approved" ? "Verified" : null,
    ]
      .map((badge) => String(badge || "").trim())
      .filter(Boolean);
    const profileImage = (user as any).profileImage || user.image || "";

    return NextResponse.json({
      user: {
        _id: String(user._id),
        name: user.name || "Study Buddy",
        profileImage,
        image: profileImage,
        role: normalizedRole,
        bio: (profile as any)?.bio || (profile as any)?.headline || "",
        xp,
        level,
        badges,
        preferredSubjects,
        createdAt: user.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Public User Profile Error:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching public profile." },
      { status: 500 }
    );
  }
}


