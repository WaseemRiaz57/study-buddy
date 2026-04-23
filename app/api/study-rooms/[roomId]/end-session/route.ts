import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import StudyRoom from "@/models/StudyRoom";

function normalizeRoomId(roomId: string): string {
  return roomId.trim();
}

interface EndSessionBody {
  currentUserId: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const body = (await request.json()) as EndSessionBody;
    const { currentUserId } = body;

    if (!currentUserId || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      return NextResponse.json(
        { message: "Invalid currentUserId" },
        { status: 400 }
      );
    }

    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    const hostObjectId = new mongoose.Types.ObjectId(currentUserId);

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (room.createdBy.toString() !== hostObjectId.toString()) {
      return NextResponse.json(
        { message: "Forbidden: only host can end session" },
        { status: 403 }
      );
    }

    room.isLive = false;

    await room.save();

    return NextResponse.json({
      message: "Session ended successfully",
      roomId: room.roomId,
      isLive: room.isLive,
      updatedAt: room.updatedAt,
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json({ message: "Failed to end session" }, { status: 500 });
  }
}
