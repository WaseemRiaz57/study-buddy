import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import StudyProfile from "@/models/StudyProfile";
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

    const currentProfile = await StudyProfile.findOne({
      userId: currentUserId,
    }).lean();

    const currentTags = new Set(
      ((currentProfile?.tags || []) as string[])
        .map(normalizeTag)
        .filter(Boolean)
    );

    const onlineProfiles = await StudyProfile.find({
      userId: { $ne: currentUserId },
      isOnline: true,
    }).lean();

    const profileUserIds = onlineProfiles
      .map((profile) => String(profile.userId || "").trim())
      .filter(Boolean);
    const objectIds = profileUserIds.filter((userId) =>
      mongoose.Types.ObjectId.isValid(userId)
    );
    const emails = profileUserIds.filter((userId) => userId.includes("@"));
    const userQueryParts = [
      ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
      ...(emails.length ? [{ email: { $in: emails } }] : []),
    ];
    const users = userQueryParts.length
      ? await User.find({ $or: userQueryParts }).select("_id email name image").lean()
      : [];
    const usersByKey = new Map(
      users.flatMap((user) => [
        [String(user._id), user],
        [String(user.email || "").toLowerCase(), user],
      ])
    );

    const suggestedPeers = onlineProfiles
      .map((profile) => {
        const profileUserId = String(profile.userId || "").trim();
        const user = usersByKey.get(profileUserId) || usersByKey.get(profileUserId.toLowerCase());
        const tags = ((profile.tags || []) as string[]).filter((tag) =>
          String(tag || "").trim()
        );
        const sharedTags = tags.filter((tag) => currentTags.has(normalizeTag(tag)));

        return {
          userId: user ? String(user._id) : profileUserId,
          name: user?.name || profile.name,
          image: user?.image || profile.image || "",
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
