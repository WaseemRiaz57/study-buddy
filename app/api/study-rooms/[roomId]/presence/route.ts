import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import { requireStudyRoomJwt } from "@/lib/study-room-auth";
import { maybeAutoCloseStudyRoom } from "@/lib/study-room-lifecycle";
import {
  getStudyRoomEmptyTtlSeconds,
  getStudyRoomState,
  markStudyRoomParticipantConnected,
  markStudyRoomParticipantDisconnected,
  touchStudyRoomState,
} from "@/lib/redis";
import {
  ROOM_AUTO_CLOSE_GRACE_SECONDS,
  STUDY_ROOM_SOCKET_NAMESPACE,
} from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";

type PresenceAction = "connect" | "disconnect";

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function parsePresenceAction(value: unknown): PresenceAction | null {
  if (value === "connect" || value === "disconnect") {
    return value;
  }

  return null;
}

function scheduleAutoCloseCheck(roomId: string): void {
  const normalizedRoomId = normalizeRoomId(roomId);

  setTimeout(() => {
    void maybeAutoCloseStudyRoom(normalizedRoomId);
  }, ROOM_AUTO_CLOSE_GRACE_SECONDS * 1000);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const authResult = await requireStudyRoomJwt(request);
    if (authResult.error) return authResult.error;

    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    const autoCloseResult = await maybeAutoCloseStudyRoom(normalizedRoomId);
    if (autoCloseResult.closed) {
      return NextResponse.json(
        { message: "Room auto-closed due to inactivity." },
        { status: 410 }
      );
    }

    await connectMongoDB();

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId })
      .select("roomId isLive participants maxParticipants")
      .lean();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (!room.isLive) {
      return NextResponse.json(
        { message: "Room is no longer live" },
        { status: 410 }
      );
    }

    const state = await getStudyRoomState(normalizedRoomId);
    const autoCloseInSeconds = await getStudyRoomEmptyTtlSeconds(normalizedRoomId);

    return NextResponse.json({
      roomId: normalizedRoomId,
      isLive: true,
      connectedCount: state?.connectedUserIds.length || 0,
      awaitingAutoClose: Boolean(state?.awaitingAutoClose),
      autoCloseInSeconds,
      socketNamespace: STUDY_ROOM_SOCKET_NAMESPACE,
    });
  } catch (error) {
    console.error("Study-room presence GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room presence" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const authResult = await requireStudyRoomJwt(request);
    if (authResult.error) return authResult.error;

    if (!mongoose.Types.ObjectId.isValid(authResult.userId)) {
      return NextResponse.json(
        { message: "Unauthorized: invalid user identity" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = parsePresenceAction(body?.action);

    if (!action) {
      return NextResponse.json(
        { message: "action must be 'connect' or 'disconnect'" },
        { status: 400 }
      );
    }

    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    const autoCloseResult = await maybeAutoCloseStudyRoom(normalizedRoomId);
    if (autoCloseResult.closed) {
      return NextResponse.json(
        { message: "Room auto-closed due to inactivity." },
        { status: 410 }
      );
    }

    await connectMongoDB();

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (!room.isLive) {
      return NextResponse.json(
        { message: "Room is no longer live" },
        { status: 410 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(authResult.userId);
    const isParticipant = room.participants.some(
      (participantId) => participantId.toString() === authResult.userId
    );

    if (action === "connect" && !isParticipant) {
      if (room.participants.length >= room.maxParticipants) {
        return NextResponse.json({ message: "Room is full" }, { status: 400 });
      }

      await StudyRoom.updateOne(
        { _id: room._id },
        {
          $addToSet: { participants: userObjectId },
        }
      );
    }

    if (action === "connect") {
      const state = await markStudyRoomParticipantConnected(
        normalizedRoomId,
        authResult.userId
      );

      await touchStudyRoomState(normalizedRoomId);

      return NextResponse.json({
        message: "Presence updated",
        roomId: normalizedRoomId,
        action,
        connectedCount: state?.connectedUserIds.length || 0,
        awaitingAutoClose: Boolean(state?.awaitingAutoClose),
        autoCloseInSeconds: null,
        socketNamespace: STUDY_ROOM_SOCKET_NAMESPACE,
      });
    }

    const state = await markStudyRoomParticipantDisconnected(
      normalizedRoomId,
      authResult.userId
    );
    const autoCloseInSeconds = await getStudyRoomEmptyTtlSeconds(normalizedRoomId);

    if ((state?.connectedUserIds.length || 0) === 0) {
      scheduleAutoCloseCheck(normalizedRoomId);
    }

    return NextResponse.json({
      message: "Presence updated",
      roomId: normalizedRoomId,
      action,
      connectedCount: state?.connectedUserIds.length || 0,
      awaitingAutoClose: Boolean(state?.awaitingAutoClose),
      autoCloseInSeconds,
      socketNamespace: STUDY_ROOM_SOCKET_NAMESPACE,
    });
  } catch (error) {
    console.error("Study-room presence POST error:", error);
    return NextResponse.json(
      { message: "Failed to update room presence" },
      { status: 500 }
    );
  }
}
