import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyRoom from "@/models/StudyRoom";

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `SB-${code}`;
}

async function generateUniqueRoomCode() {
  let tries = 0;

  while (tries < 10) {
    const candidate = generateRoomCode();
    const exists = await StudyRoom.exists({ roomId: candidate });

    if (!exists) {
      return candidate;
    }

    tries += 1;
  }

  throw new Error("Failed to generate unique roomId.");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { topic, maxParticipants, privacy } = await request.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ message: "topic is required" }, { status: 400 });
    }

    await connectMongoDB();

    const roomId = await generateUniqueRoomCode();
    const hostId = new mongoose.Types.ObjectId(session.user.id);

    const room = await StudyRoom.create({
      topic: topic.trim(),
      roomId,
      maxParticipants:
        typeof maxParticipants === "number" && Number.isFinite(maxParticipants)
          ? maxParticipants
          : undefined,
      privacy: privacy === "Invite" ? "Invite" : "Public",
      host: hostId,
      participants: [hostId],
      isLive: true,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Study room created successfully",
        roomId: room.roomId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create study room error:", error);
    return NextResponse.json({ message: "Failed to create study room" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    const rooms = await StudyRoom.find({ isLive: true, privacy: "Public" })
      .populate("host", "name")
      .sort({ createdAt: -1 })
      .lean();

    const formattedRooms = rooms.map((room) => ({
      _id: room._id,
      topic: room.topic,
      roomId: room.roomId,
      maxParticipants: room.maxParticipants,
      privacy: room.privacy,
      isLive: room.isLive,
      createdAt: room.createdAt,
      host: room.host,
      participantsCount: Array.isArray(room.participants) ? room.participants.length : 0,
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("Fetch study rooms error:", error);
    return NextResponse.json({ message: "Failed to fetch study rooms" }, { status: 500 });
  }
}
