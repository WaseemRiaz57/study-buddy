import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import { closeStudyRoomAndPersistDuration } from "@/lib/study-room-lifecycle";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeRoomId(roomId: unknown): string {
  return String(roomId || "").trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function handleLeave(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = String(session?.user?.id || "").trim();

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!normalizedRoomId) {
    return NextResponse.json({ message: "roomId is required" }, { status: 400 });
  }

  await connectDB();

  const updatedRoom = await StudyRoom.findOneAndUpdate(
    {
      roomId: { $regex: `^${escapeRegex(normalizedRoomId)}$`, $options: "i" },
    },
    {
      $pull: { participants: new mongoose.Types.ObjectId(userId) },
    },
    { new: true }
  ).lean();

  if (!updatedRoom) {
    return NextResponse.json({ message: "Study room not found" }, { status: 404 });
  }

  const participantCount = Array.isArray(updatedRoom.participants)
    ? updatedRoom.participants.length
    : 0;
  const hostHasLeft = String(updatedRoom.createdBy || "") === userId;

  if ((hostHasLeft || participantCount === 0) && updatedRoom.status !== "ended") {
    await closeStudyRoomAndPersistDuration(
      normalizedRoomId,
      hostHasLeft ? "manual" : "inactive-disconnect"
    );
  }

  return NextResponse.json({
    success: true,
    roomId: normalizedRoomId,
    participantCount,
    status: hostHasLeft || participantCount === 0 ? "ended" : updatedRoom.status,
  });
}

export const POST = handleLeave;
export const PATCH = handleLeave;
