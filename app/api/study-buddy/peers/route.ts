import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyProfile from "@/models/StudyProfile";
import User from "@/models/User";

// GET /api/study-buddy/peers — fetch active, looking-for-match users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Ensure the current user has a StudyProfile (upsert on first visit)
    await StudyProfile.findOneAndUpdate(
      { userId: session.user.email },
      {
        $setOnInsert: {
          name: session.user.name ?? "Anonymous",
          image: session.user.image ?? "",
          tags: [],
        },
        $set: { isOnline: true },
      },
      { upsert: true, new: true }
    );

    const activeCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await User.find({
      _id: { $ne: session.user.id },
      role: "student",
      lastActive: { $gt: activeCutoff },
    })
      .select("_id name image subjects")
      .lean();

    const profiles = await StudyProfile.find({
      userId: { $in: activeUsers.map((user) => String(user._id)) },
    })
      .select("userId isLookingForMatch currentSubject currentTopic tags")
      .lean();
    const profileByUserId = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );

    const peers = activeUsers.map((user) => {
      const profile = profileByUserId.get(String(user._id));

      return {
        userId: String(user._id),
        name: user.name || "Study Buddy",
        image: user.image || "",
        isOnline: true,
        isLookingForMatch: Boolean(profile?.isLookingForMatch),
        currentSubject: profile?.currentSubject || "",
        currentTopic: profile?.currentTopic || "",
        tags: profile?.tags || user.subjects || [],
      };
    });

    return NextResponse.json(peers);
  } catch (error) {
    console.error("Error fetching peers:", error);
    return NextResponse.json(
      { message: "Error fetching peers" },
      { status: 500 }
    );
  }
}


