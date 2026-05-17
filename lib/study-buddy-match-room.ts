import mongoose from "mongoose";
import StudyRoom from "@/models/StudyRoom";

function generateShortRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return `SB-${code}`;
}

export async function createStudyBuddyMatchRoom({
  hostId,
  peerId,
  subject,
}: {
  hostId: string;
  peerId: string;
  subject: string;
}) {
  let roomId = generateShortRoomId();
  let existingRoom = await StudyRoom.exists({ roomId });

  while (existingRoom) {
    roomId = generateShortRoomId();
    existingRoom = await StudyRoom.exists({ roomId });
  }

  const room = await StudyRoom.create({
    roomId,
    createdBy: new mongoose.Types.ObjectId(hostId),
    title: subject || "Study Buddy Session",
    participants: [
      new mongoose.Types.ObjectId(hostId),
      new mongoose.Types.ObjectId(peerId),
    ],
    maxParticipants: 20,
    isActive: true,
    status: "active",
    isLive: true,
  });

  return {
    roomObjectId: room._id,
    roomId: room.roomId,
  };
}

