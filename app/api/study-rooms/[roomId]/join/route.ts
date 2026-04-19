import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import { requireStudyRoomJwt } from "@/lib/study-room-auth";
import { maybeAutoCloseStudyRoom } from "@/lib/study-room-lifecycle";
import { touchStudyRoomState } from "@/lib/redis";
import { STUDY_ROOM_SOCKET_NAMESPACE } from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";

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

    const { roomId } = await params;
    const normalizedRoomId = roomId.toUpperCase();

    await maybeAutoCloseStudyRoom(normalizedRoomId);

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

  const alreadyParticipant = room.participants.some(
  (participantId: any) => participantId.toString() === authResult.userId
);

    if (!alreadyParticipant && room.participants.length >= room.maxParticipants) {
      return NextResponse.json({ message: "Room is full" }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(authResult.userId);

    await StudyRoom.updateOne(
      { _id: room._id },
      {
        $addToSet: { participants: userId },
      }
    );

    await touchStudyRoomState(room.roomId);

    return NextResponse.json({
      message: "Joined room successfully",
      roomId: room.roomId,
      socketNamespace: STUDY_ROOM_SOCKET_NAMESPACE,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json({ message: "Failed to join room" }, { status: 500 });
  }
}
