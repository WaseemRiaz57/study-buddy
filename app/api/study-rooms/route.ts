import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CreateStudyRoomBody {
  roomId: string;
  title: string;
  maxParticipants?: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const rooms = await StudyRoom.find({
      $or: [
        { $and: [{ isActive: true }, { status: "active" }] },
        { $and: [{ isActive: { $exists: false } }, { isLive: true }] },
        { $and: [{ status: { $exists: false } }, { isLive: true }] },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateStudyRoomBody;
    const { roomId, title } = body;
    const normalizedRoomId = String(roomId || "").trim().toUpperCase();
    const normalizedTitle = String(title || "").trim();
    const maxParticipants = Number(body.maxParticipants || 8);

    if (!/^[A-Z0-9-]{3,32}$/.test(normalizedRoomId) || !normalizedTitle) {
      return NextResponse.json(
        { message: "Valid roomId and title are required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 20) {
      return NextResponse.json(
        { message: "maxParticipants must be an integer between 2 and 20" },
        { status: 400 }
      );
    }

    await connectDB();

    const creatorObjectId = new mongoose.Types.ObjectId(session.user.id);

    const room = await StudyRoom.create({
      roomId: normalizedRoomId,
      createdBy: creatorObjectId,
      title: normalizedTitle,
      participants: [creatorObjectId],
      maxParticipants,
      isActive: true,
      status: "active",
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
