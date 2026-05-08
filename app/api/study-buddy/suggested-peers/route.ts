import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import StudyProfile from "@/models/StudyProfile";

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

    const suggestedPeers = onlineProfiles
      .map((profile) => {
        const tags = ((profile.tags || []) as string[]).filter((tag) =>
          String(tag || "").trim()
        );
        const sharedTags = tags.filter((tag) => currentTags.has(normalizeTag(tag)));

        return {
          userId: profile.userId,
          name: profile.name,
          image: profile.image || "",
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
