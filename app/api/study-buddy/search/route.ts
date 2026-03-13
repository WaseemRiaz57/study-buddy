import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyProfile from "@/models/StudyProfile";
import StudySession from "@/models/StudySession";
import User from "@/models/User";

// POST /api/study-buddy/search — matchmaking by subject + topic
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { subject, topic } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json(
        { message: "Subject and topic are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const currentUserEmail = session.user.email;
    const currentUser = await User.findOne({ email: currentUserEmail });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Look for another user who is looking for the same subject + topic
    const match = await StudyProfile.findOne({
      userId: { $ne: currentUserEmail },
      isLookingForMatch: true,
      currentSubject: subject,
      currentTopic: topic,
    });

    if (match) {
      // Resolve matched user's email to their User _id
      const matchedUser = await User.findOne({ email: match.userId });
      if (!matchedUser) {
        return NextResponse.json({ status: "waiting" });
      }

      // Create a pending session (receiver still needs to accept)
      const newSession = await StudySession.create({
        requesterId: currentUser._id,
        receiverId: matchedUser._id,
        subject,
        topic,
        status: "pending",
      });

      // Reset both users' looking status
      await StudyProfile.updateMany(
        { userId: { $in: [currentUserEmail, match.userId] } },
        { $set: { isLookingForMatch: false, currentSubject: "", currentTopic: "" } }
      );

      return NextResponse.json({
        status: "matched",
        sessionId: newSession._id.toString(),
        peer: {
          name: match.name,
          image: match.image,
          tags: match.tags,
          userId: match.userId,
        },
      });
    }

    // No match yet — mark current user as looking
    await StudyProfile.findOneAndUpdate(
      { userId: currentUserEmail },
      {
        $set: {
          isLookingForMatch: true,
          currentSubject: subject,
          currentTopic: topic,
        },
        $setOnInsert: {
          name: session.user.name ?? "Anonymous",
          image: session.user.image ?? "",
          tags: [subject, topic],
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ status: "waiting" });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { message: "Error during matchmaking" },
      { status: 500 }
    );
  }
}
