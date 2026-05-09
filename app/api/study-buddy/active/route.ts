import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import BuddyMatch from "@/models/BuddyMatch";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";

function normalizeRoomId(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const connectionId = String(body?.connectionId || "").trim();
    const roomId = normalizeRoomId(body?.roomId);

    await connectMongoDB();

    const userObjectId = mongoose.Types.ObjectId.isValid(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    let room = roomId
      ? await StudyRoom.findOne({
          roomId: { $regex: `^${escapeRegex(roomId)}$`, $options: "i" },
        })
      : null;

    let connection = null;

    if (connectionId && mongoose.Types.ObjectId.isValid(connectionId)) {
      connection = await BuddyConnection.findOne({
        _id: connectionId,
        status: "accepted",
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      });
    }

    if (!connection && roomId) {
      connection = await BuddyConnection.findOne({
        roomId,
        status: "accepted",
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      });
    }

    if (!room && connection?.roomId) {
      room = await StudyRoom.findOne({
        roomId: {
          $regex: `^${escapeRegex(normalizeRoomId(connection.roomId))}$`,
          $options: "i",
        },
      });
    }

    if (connection) {
      await BuddyConnection.findByIdAndDelete(connection._id);
    }

    if (room) {
      room.isActive = false;
      room.isLive = false;
      room.status = "cancelled";
      await room.save();
    }

    if (room?._id || userObjectId) {
      const matchQuery: Record<string, unknown> = {
        status: { $in: ["Searching", "Pending", "Connected"] },
      };

      if (room?._id) {
        matchQuery.roomId = room._id;
      } else if (userObjectId) {
        matchQuery.$or = [
          { studentId: userObjectId },
          { matchedPeerId: userObjectId },
        ];
      }

      await BuddyMatch.updateMany(matchQuery, {
        $set: { status: "Rejected" },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Session cancelled",
      connectionId: connection ? String(connection._id) : "",
      roomId: room?.roomId || roomId,
    });
  } catch (error) {
    console.error("Cancel Study Buddy Session Error:", error);
    return NextResponse.json(
      { message: "Failed to cancel active session." },
      { status: 500 }
    );
  }
}
