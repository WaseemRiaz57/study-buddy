import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import { closeStudyRoomAndPersistDuration } from "@/lib/study-room-lifecycle";
import StudyRoom from "@/models/StudyRoom";

function normalizeRoomId(roomId: string): string {
  return roomId.trim();
}

async function endSession(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = String(session?.user?.id || "").trim();

    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = String(session?.user?.role || "").toLowerCase();
    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden: only Mentors can end sessions" },
        { status: 403 }
      );
    }

    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    const hostObjectId = new mongoose.Types.ObjectId(requesterId);

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

    await closeStudyRoomAndPersistDuration(room.roomId, "manual");

    return NextResponse.json({
      message: "Session ended successfully. Room marked inactive.",
      roomId: room.roomId,
      isLive: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json({ message: "Failed to end session" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  return endSession(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  return endSession(request, context);
}
