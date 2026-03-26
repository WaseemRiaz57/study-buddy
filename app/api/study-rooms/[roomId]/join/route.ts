import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyRoom from "@/models/StudyRoom";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const normalizedRoomId = roomId.toUpperCase();

    await connectMongoDB();

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    if (!room.isLive) {
      return NextResponse.json({ message: "Room is no longer live" }, { status: 400 });
    }

    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json({ message: "Room is full" }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    await StudyRoom.updateOne(
      { _id: room._id },
      {
        $addToSet: { participants: userId },
      }
    );

    return NextResponse.json({
      message: "Joined room successfully",
      roomId: room.roomId,
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json({ message: "Failed to join room" }, { status: 500 });
  }
}
