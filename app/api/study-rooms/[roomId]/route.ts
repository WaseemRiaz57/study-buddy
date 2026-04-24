import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
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
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

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

    const populatedRoom = room as {
      createdBy?: { _id?: unknown } | unknown;
    };
    const hostId = String(
      (typeof populatedRoom.createdBy === "object" && populatedRoom.createdBy !== null
        ? (populatedRoom.createdBy as { _id?: unknown })._id
        : populatedRoom.createdBy) || ""
    ).trim();

    return NextResponse.json({
      room,
      currentUserId,
      hostId,
    });
  } catch (error) {
    console.error("Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
