import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import { createStudyBuddyMatchRoom } from "@/lib/study-buddy-match-room";
import BuddyMatch from "@/models/BuddyMatch";
import StudentProfile from "@/models/StudentProfile";
import StudyProfile from "@/models/StudyProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const listingId = String(body?.listingId || body?.matchId || "").trim();
    const subject = String(body?.subject || "").trim();
    const topic = String(body?.topic || "").trim();

    await connectDB();

    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

    if (listingId) {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return NextResponse.json(
          { message: "Invalid listing id." },
          { status: 400 }
        );
      }

      const matchedBuddy = await BuddyMatch.findOneAndUpdate(
        {
          _id: listingId,
          status: "Searching",
          studentId: { $ne: currentUserObjectId },
        },
        {
          $set: {
            status: "Pending",
            matchedPeerId: currentUserObjectId,
          },
        },
        { new: true }
      ).lean();

      if (!matchedBuddy) {
        return NextResponse.json(
          { message: "Listing is no longer available." },
          { status: 404 }
        );
      }

      const peerId = String(matchedBuddy.studentId);
      const room = await createStudyBuddyMatchRoom({
        hostId: currentUserId,
        peerId,
        subject: matchedBuddy.subject,
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

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required." },
        { status: 400 }
      );
    }

    const currentStudentProfile = await StudentProfile.findOne({
      userId: currentUserObjectId,
    })
      .select("interestedSubjects")
      .lean();
    const currentInterestedSubjects =
      currentStudentProfile?.interestedSubjects || [];

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
          tags: currentInterestedSubjects,
        },
      },
      { upsert: true, new: true }
    );

    const subjectMatcher = new RegExp(escapeRegex(subject), "i");
    const interestedProfiles = await StudentProfile.find({
      userId: { $ne: currentUserObjectId },
      interestedSubjects: subjectMatcher,
    })
      .select("userId")
      .lean();
    const interestedUserIds = interestedProfiles
      .map((profile) => String(profile.userId))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const matchedBuddy = await BuddyMatch.findOneAndUpdate(
      {
        status: "Searching",
        subject,
        studentId:
          interestedUserIds.length > 0
            ? { $in: interestedUserIds }
            : { $ne: currentUserObjectId },
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


