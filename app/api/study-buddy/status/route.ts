import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import { createStudyBuddyMatchRoom } from "@/lib/study-buddy-match-room";
import { setStudentOnline, setStudentOffline } from "@/lib/redis";
import BuddyConnection from "@/models/BuddyConnection";
import BuddyMatch from "@/models/BuddyMatch";
import StudyRoom from "@/models/StudyRoom";
import StudySession from "@/models/StudySession";
import StudyProfile from "@/models/StudyProfile";
import User from "@/models/User";
import mongoose from "mongoose";

type LeanStudySession = {
  _id: { toString(): string };
  requesterId: { toString(): string };
  receiverId: { toString(): string };
  status: string;
  selectedMode?: "chat" | "video" | null;
};

type LeanPeer = {
  name?: string;
  image?: string;
};

type LeanBuddyMatch = {
  _id: { toString(): string };
  studentId: { toString(): string };
  matchedPeerId?: { toString(): string } | null;
  subject: string;
  status: "Searching" | "Pending" | "Connected" | "Rejected";
  roomId?: { toString(): string } | null;
};

type LeanStudyRoom = {
  _id: { toString(): string };
  roomId: string;
};

type LeanBuddyConnection = {
  _id: { toString(): string };
  requester: { toString(): string };
  recipient: { toString(): string };
  subject: string;
  roomId?: string;
  status: "pending" | "accepted" | "rejected" | "completed";
};

// GET /api/study-buddy/status?sessionId=... — User A polls to check if User B responded
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const matchId = searchParams.get("matchId");
    const sessionId = searchParams.get("sessionId");

    if (requestId) {
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return NextResponse.json(
          { message: "A valid requestId query param is required." },
          { status: 400 }
        );
      }

      await connectMongoDB();

      const connection = (await BuddyConnection.findById(requestId).lean()) as
        | LeanBuddyConnection
        | null;

      if (!connection) {
        return NextResponse.json(
          { requestId, status: "rejected", matchFound: false },
          { status: 200 }
        );
      }

      const requesterId = connection.requester.toString();
      const recipientId = connection.recipient.toString();

      if (requesterId !== currentUserId && recipientId !== currentUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      if (connection.status === "pending") {
        return NextResponse.json({
          requestId,
          status: "pending",
          matchFound: false,
        });
      }

      if (connection.status !== "accepted") {
        return NextResponse.json({
          requestId,
          status: "rejected",
          matchFound: false,
        });
      }

      const peerId = requesterId === currentUserId ? recipientId : requesterId;
      let roomId = String(connection.roomId || "").trim();

      if (!roomId) {
        const createdRoom = await createStudyBuddyMatchRoom({
          hostId: recipientId,
          peerId: requesterId,
          subject: connection.subject,
        });
        roomId = createdRoom.roomId;
        await BuddyConnection.findByIdAndUpdate(requestId, {
          $set: { roomId },
        });
      }

      const peer = (await User.findById(peerId, "name image").lean()) as LeanPeer | null;

      return NextResponse.json({
        requestId,
        matchFound: true,
        status: "accepted",
        roomId,
        peer: {
          id: peerId,
          name: peer?.name || "Study Buddy",
          image: peer?.image || "",
        },
      });
    }

    if (matchId) {
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        return NextResponse.json(
          { message: "A valid matchId query param is required." },
          { status: 400 }
        );
      }

      await connectMongoDB();

      const match = (await BuddyMatch.findById(matchId).lean()) as
        | LeanBuddyMatch
        | null;

      if (!match) {
        return NextResponse.json({ message: "Match not found" }, { status: 404 });
      }

      const studentId = match.studentId.toString();
      const matchedPeerId = match.matchedPeerId?.toString() || "";
      const isStudent = studentId === currentUserId;
      const isMatchedPeer = matchedPeerId === currentUserId;

      if (!isStudent && !isMatchedPeer) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      if (match.status === "Rejected") {
        return NextResponse.json({
          matchId,
          matchFound: false,
          status: "rejected",
        });
      }

      if (match.status === "Searching" || !matchedPeerId) {
        return NextResponse.json({
          matchId,
          matchFound: false,
          status: "Searching",
        });
      }

      const peerId = isStudent ? matchedPeerId : studentId;
      let room = match.roomId
        ? ((await StudyRoom.findById(match.roomId).lean()) as LeanStudyRoom | null)
        : null;

      if (!room) {
        return NextResponse.json({
          matchId,
          matchFound: false,
          status: "Pending",
        });
      }

      if (match.status !== "Connected") {
        await BuddyMatch.findByIdAndUpdate(matchId, {
          $set: { status: "Connected" },
        });
      }

      const peer = (await User.findById(peerId, "name image").lean()) as LeanPeer | null;

      return NextResponse.json({
        matchId,
        matchFound: true,
        status: "matched",
        roomId: room?.roomId || "",
        peer: {
          id: peerId,
          name: peer?.name || "Study Buddy",
          image: peer?.image || "",
        },
      });
    }

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "A valid requestId, matchId, or sessionId query param is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const studySession = (await StudySession.findById(sessionId).lean()) as
      | LeanStudySession
      | null;
    if (!studySession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Determine who the "other" user is
    const isRequester =
      studySession.requesterId.toString() === currentUser._id.toString();
    const isReceiver =
      studySession.receiverId.toString() === currentUser._id.toString();

    if (!isRequester && !isReceiver) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const peerId = isRequester
      ? studySession.receiverId
      : studySession.requesterId;

    const peer = (await User.findById(peerId, "name image").lean()) as LeanPeer | null;

    return NextResponse.json({
      sessionId: studySession._id.toString(),
      status: studySession.status,
      selectedMode: studySession.selectedMode,
      peer: {
        name: peer?.name || "Study Buddy",
        image: peer?.image || "",
      },
    });
  } catch (error) {
    console.error("Status Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch session status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-buddy/status
 * Body: { online: boolean }
 *
 * Sets the student's online status in Redis (primary) and MongoDB (fallback).
 * The front-end should call this as a heartbeat (~every 4 min) to stay "online".
 * Restricted to students only.
 */
export async function POST(req: Request) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const { online } = await req.json();
    const studentId = session!.user.id;

    // Update Redis (primary)
    if (online) {
      await setStudentOnline(studentId);
    } else {
      await setStudentOffline(studentId);
    }

    // Update MongoDB fallback and the profile collection used by Suggested Peers.
    await connectMongoDB();
    await User.findByIdAndUpdate(studentId, { isOnline: !!online });
    await StudyProfile.updateOne(
      { userId: studentId },
      {
        $set: {
          isOnline: !!online,
        },
        $setOnInsert: {
          userId: studentId,
          name: session!.user.name || "Study Buddy",
          image: session!.user.image || "",
          isLookingForMatch: false,
          currentSubject: "",
          currentTopic: "",
          tags: [],
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      { message: `Status set to ${online ? "online" : "offline"}.` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Online Status Error:", err);
    return NextResponse.json(
      { message: "Failed to update online status." },
      { status: 500 }
    );
  }
}
