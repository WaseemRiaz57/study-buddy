import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose"; // 👈 Naya import zaroori tha ObjectId ke liye
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = 'force-dynamic';

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);
    const session = await getServerSession(authOptions);
    
    // 👇 Session check zaroori hai room create karne se pehle
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(session.user.id).trim();
    const participantName = session.user.name || "Student";

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    if (!/^[A-Z0-9-]{3,32}$/.test(normalizedRoomId)) {
      return NextResponse.json({ message: "Invalid roomId" }, { status: 400 });
    }

    await connectDB();

    let room = await StudyRoom.findOne({
      roomId: { $regex: `^${escapeRegex(normalizedRoomId)}$`, $options: "i" },
    })
      .populate("createdBy", "name")
      .populate("participants", "name")
      .lean();

    // ==========================================
    // 🚀 THE FIX: Agar DB mein room nahi hai, toh 404 mat do, naya bana lo!
    // ==========================================
    if (!room) {
      console.log(`[Room API] Room not found. Auto-creating room: ${normalizedRoomId}`);
      
      const newRoom = await StudyRoom.create({
        roomId: normalizedRoomId,
        createdBy: new mongoose.Types.ObjectId(currentUserId),
        title: "Study Buddy Session",
        participants: [new mongoose.Types.ObjectId(currentUserId)],
        isActive: true,
        status: "active",
        isLive: true,
      });

      // Naya room banne ke baad usay dobara fetch kar lo taake populate ho jaye
      room = await StudyRoom.findById(newRoom._id)
        .populate("createdBy", "name")
        .populate("participants", "name")
        .lean();
    }

    const populatedRoom = room as {
      createdBy?: { _id?: unknown } | unknown;
    };
    const hostId = String(
      (typeof populatedRoom.createdBy === "object" && populatedRoom.createdBy !== null
        ? (populatedRoom.createdBy as { _id?: unknown })._id
        : populatedRoom.createdBy) || ""
    ).trim();

    console.log(`[Room API] Room Ready. Generating Token for User: ${participantName}`);

    // ==========================================
    // 🚀 TOKEN GENERATION LOGIC 
    // ==========================================
    // Jab LiveKit SDK lagayen toh yahan apna actual token generate karein
    const token = "dummy_token_for_now_replace_with_livekit_token";

    return NextResponse.json({
      room,
      currentUserId,
      hostId,
      token, 
    }, { status: 200 }); // 👈 404 hata kar 200 Success kar diya
  } catch (error) {
    console.error("Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
