import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import { createStudyBuddyMatchRoom } from "@/lib/study-buddy-match-room";
import BuddyMatch from "@/models/BuddyMatch";
import StudyProfile from "@/models/StudyProfile";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      return NextResponse.json(
        { message: "Invalid user session." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const subject = String(body?.subject || "").trim();
    const topic = String(body?.topic || "").trim();

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    await StudyProfile.findOneAndUpdate(
      { userId: currentUserId },
      {
        $set: {
          name: session?.user?.name || "Student",
          image: session?.user?.image || "",
          isOnline: true,
          isLookingForMatch: true,
          currentSubject: subject,
          currentTopic: topic,
        },
        $setOnInsert: {
          tags: [],
        },
      },
      { upsert: true, new: true }
    );

    const matchedBuddy = await BuddyMatch.findOneAndUpdate(
      {
        status: "Searching",
        subject,
        studentId: { $ne: currentUserObjectId },
      },
      {
        $set: {
          status: "Pending",
          matchedPeerId: currentUserObjectId,
        },
      },
      { new: true, sort: { createdAt: 1 } }
    ).lean();

    if (matchedBuddy) {
      const peerId = String(matchedBuddy.studentId);
      const room = await createStudyBuddyMatchRoom({
        hostId: currentUserId,
        peerId,
        subject,
      });

      const updatedMatch = await BuddyMatch.findByIdAndUpdate(
        matchedBuddy._id,
        { $set: { roomId: room.roomObjectId } },
        { new: true }
      ).lean();

      const peer = await User.findById(peerId, "name image").lean();

      await Promise.all([
        StudyProfile.findOneAndUpdate(
          { userId: currentUserId },
          { $set: { isLookingForMatch: false } }
        ),
        StudyProfile.findOneAndUpdate(
          { userId: peerId },
          { $set: { isLookingForMatch: false } }
        ),
      ]);

      return NextResponse.json(
        {
          message: "Match found.",
          matchFound: true,
          matchId: String(matchedBuddy._id),
          roomId: room.roomId,
          peer: {
            id: peerId,
            name: peer?.name || "Study Buddy",
            image: peer?.image || "",
          },
          match: updatedMatch || matchedBuddy,
        },
        { status: 200 }
      );
    }

    let waitingMatch = await BuddyMatch.findOne({
      studentId: currentUserObjectId,
      subject,
      status: "Searching",
    }).lean();

    if (!waitingMatch) {
      waitingMatch = await BuddyMatch.create({
        studentId: currentUserObjectId,
        subject,
        topic,
        status: "Searching",
      }).then((match) => match.toObject());
    }

    return NextResponse.json(
      {
        message: "Waiting for peer.",
        matchFound: false,
        matchId: String(waitingMatch._id),
        status: "Waiting for peer",
        match: waitingMatch,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Find Buddy Error:", error);
    return NextResponse.json(
      { message: "Internal server error while finding a buddy." },
      { status: 500 }
    );
  }
}
