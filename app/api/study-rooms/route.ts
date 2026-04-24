import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";

interface CreateStudyRoomBody {
  roomId: string;
  createdBy: string;
  title: string;
  participants?: string[];
}

export async function GET() {
  try {
    await connectDB();

    const rooms = await StudyRoom.find({
      $or: [
        { isActive: true },
        { status: "active" },
        { isLive: true },
      ],
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("Get study rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch study rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateStudyRoomBody;
    const { roomId, createdBy, title, participants = [] } = body;

    if (!roomId || !createdBy || !title) {
      return NextResponse.json(
        { message: "roomId, createdBy and title are required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return NextResponse.json(
        { message: "Invalid createdBy user id" },
        { status: 400 }
      );
    }

    await connectDB();

    const participantIds = participants
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const creatorObjectId = new mongoose.Types.ObjectId(createdBy);

    const room = await StudyRoom.create({
      roomId: roomId.trim(),
      createdBy: creatorObjectId,
      title: title.trim(),
      participants:
        participantIds.length > 0
          ? participantIds
          : [creatorObjectId],
      isLive: true,
    });

    return NextResponse.json(
      {
        message: "Study room created successfully",
        room,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create study room error:", error);
    return NextResponse.json(
      { message: "Failed to create study room" },
      { status: 500 }
    );
  }
}
