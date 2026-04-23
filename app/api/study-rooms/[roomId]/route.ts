import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/connectDB";
import StudyRoom from "@/models/StudyRoom";

function normalizeRoomId(roomId: string): string {
  return roomId.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId })
      .populate("createdBy", "name email")
      .populate("participants", "name email")
      .lean();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      room,
    });
  } catch (error) {
    console.error("Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
