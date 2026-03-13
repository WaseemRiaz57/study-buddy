import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyProfile from "@/models/StudyProfile";

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

    // Return all online peers except the current user
    const peers = await StudyProfile.find({
      isOnline: true,
      userId: { $ne: session.user.email },
    })
      .select("userId name image isOnline isLookingForMatch currentSubject currentTopic tags")
      .lean();

    return NextResponse.json(peers);
  } catch (error) {
    console.error("Error fetching peers:", error);
    return NextResponse.json(
      { message: "Error fetching peers" },
      { status: 500 }
    );
  }
}
