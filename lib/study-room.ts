import { connectMongoDB } from "@/lib/mongodb";
import {
  initializeStudyRoomState,
  touchStudyRoomState,
} from "@/lib/redis";
import { STUDY_ROOM_SOCKET_NAMESPACE } from "@/lib/study-room-constants";
import StudyRoom from "@/models/StudyRoom";
import Notification from "@/models/Notification";
import User from "@/models/User";
import mongoose from "mongoose";

export interface StartRoomResult {
  roomId: string;
  socketNamespace: string;
  startTime: Date;
}

function generateShortRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `SB-${code}`;
}

/**
 * UC-14 / FR-7 — StartStudyRoom Algorithm
 *
 * 1. Generate a short room code for the shared study space.
 * 2. Create a StudyRoom record in MongoDB with ActiveStatus: true.
 * 3. Dispatch a "room_created" notification to the matched peer (FR-12).
 * 4. Return the room ID + socket namespace so the frontend can connect.
 */
export async function startStudyRoom(
  studentAId: string,
  studentBId: string,
  subject?: string
): Promise<StartRoomResult> {
  await connectMongoDB();

  // ── 1. Persist StudyRoom ──────────────────────────────────────────
  let roomCode = generateShortRoomId();
  let existingRoom = await StudyRoom.exists({ roomId: roomCode });

  while (existingRoom) {
    roomCode = generateShortRoomId();
    existingRoom = await StudyRoom.exists({ roomId: roomCode });
  }

  const room = await StudyRoom.create({
    roomType: "buddy_session",
    topic: subject?.trim() || "General Study",
    roomId: roomCode,
    maxParticipants: 20,
    privacy: "Invite",
    host: new mongoose.Types.ObjectId(studentAId),
    participants: [
      new mongoose.Types.ObjectId(studentAId),
      new mongoose.Types.ObjectId(studentBId),
    ],
    isLive: true,
    closedAt: null,
    sessionDurationMinutes: 0,
    createdAt: new Date(),
  });

  await initializeStudyRoomState(room.roomId, []);
  await touchStudyRoomState(room.roomId);

  // ── 3. Dispatch notifications (FR-12) ─────────────────────────────
  // Notify studentB that a room has been created
  const studentA = await User.findById(studentAId, "name").lean() as { name?: string } | null;
  const senderName = studentA?.name || "Your study buddy";

  await Notification.create({
    recipientId: new mongoose.Types.ObjectId(studentBId),
    senderId: new mongoose.Types.ObjectId(studentAId),
    type: "room_created",
    title: "Study Room Ready!",
    message: `${senderName} started a study room${subject ? ` for ${subject}` : ""}. Join now!`,
    read: false,
    metadata: {
      roomId: room._id.toString(),
      subject: subject || "",
    },
  });

  // Also notify studentA (confirmation)
  const studentB = await User.findById(studentBId, "name").lean() as { name?: string } | null;
  const peerName = studentB?.name || "Your study buddy";

  await Notification.create({
    recipientId: new mongoose.Types.ObjectId(studentAId),
    senderId: new mongoose.Types.ObjectId(studentBId),
    type: "room_created",
    title: "Study Room Created!",
    message: `Your study room with ${peerName}${subject ? ` for ${subject}` : ""} is ready.`,
    read: false,
    metadata: {
      roomId: room._id.toString(),
      subject: subject || "",
    },
  });

  return {
    roomId: room.roomId,
    socketNamespace: STUDY_ROOM_SOCKET_NAMESPACE,
    startTime: room.createdAt,
  };
}

