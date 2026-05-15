import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

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
      .select("_id name image subjects email")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const [profile, progress] = await Promise.all([
      StudentProfile.findOne({ userId: user._id })
        .select("bio headline interestedSubjects xp subscriptionTier academicLevel")
        .lean(),
      UserProgress.findOne({
        $or: [{ userId }, { userId: String(user.email || "").toLowerCase() }],
      })
        .select("xp level")
        .lean(),
    ]);

    const preferredSubjects = Array.from(
      new Set([
        ...((profile?.interestedSubjects || []) as string[]),
        ...((user.subjects || []) as string[]),
      ].map((subject) => String(subject || "").trim()).filter(Boolean))
    ).slice(0, 12);

    const xp = Number(profile?.xp ?? progress?.xp ?? 0);
    const level = Number(progress?.level ?? Math.max(1, Math.floor(xp / 250) + 1));
    const badges = [profile?.subscriptionTier, profile?.academicLevel]
      .map((badge) => String(badge || "").trim())
      .filter(Boolean);

    return NextResponse.json({
      user: {
        _id: String(user._id),
        name: user.name || "Study Buddy",
        image: user.image || "",
        bio: profile?.bio || profile?.headline || "",
        xp,
        level,
        badges,
        preferredSubjects,
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
