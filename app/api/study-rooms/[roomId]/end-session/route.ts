import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import { requireStudyRoomJwt } from "@/lib/study-room-auth";
import StudyRoom from "@/models/StudyRoom";

function normalizeRoomId(roomId: string): string {
  return roomId.trim();
}

export async function PATCH(
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
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectMongoDB();

    const hostObjectId = new mongoose.Types.ObjectId(authResult.userId);

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (room.host.toString() !== hostObjectId.toString()) {
      return NextResponse.json(
        { message: "Forbidden: only host can end session" },
        { status: 403 }
      );
    }

    room.isLive = false;
    room.closedAt = new Date();

    await room.save();

    return NextResponse.json({
      message: "Session ended successfully",
      roomId: room.roomId,
      isLive: room.isLive,
      closedAt: room.closedAt,
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json({ message: "Failed to end session" }, { status: 500 });
  }
}
