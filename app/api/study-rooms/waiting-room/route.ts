import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WaitingStatus = "waiting" | "admitted" | "declined";

type WaitingListEntry = {
  userId?: string;
  userName?: string;
  status?: WaitingStatus;
};

type WaitingRoomBody = {
  action?: "knock" | "respond";
  roomId?: string;
  userId?: string;
  userName?: string;
  targetUserId?: string;
  status?: WaitingStatus;
};

function normalizeRoomId(roomId: unknown): string {
  return String(roomId || "").trim().toUpperCase();
}

function normalizeUserId(userId: unknown): string {
  return String(userId || "").trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveRoomHostId(room: unknown): string {
  const createdBy = (room as { createdBy?: { _id?: unknown } | unknown })?.createdBy;
  const host = (room as { host?: { _id?: unknown } | unknown })?.host;
  const owner = createdBy || host;

  return String(
    owner && typeof owner === "object" && "_id" in owner
      ? (owner as { _id?: unknown })._id
      : owner || ""
  ).trim();
}

async function getRoom(roomId: string) {
  return StudyRoom.findOne({
    roomId: { $regex: `^${escapeRegex(roomId)}$`, $options: "i" },
  });
}

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return normalizeUserId(session?.user?.id);
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as WaitingRoomBody;
    const action = body.action;
    const roomId = normalizeRoomId(body.roomId);

    if (!roomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    const room = await getRoom(roomId);

    if (!room) {
      return NextResponse.json({ message: "Study room not found" }, { status: 404 });
    }

    if (action === "knock") {
      const userId = normalizeUserId(body.userId || currentUserId);
      const userName = String(body.userName || "Study Buddy").trim();

      if (!userId) {
        return NextResponse.json({ message: "userId is required" }, { status: 400 });
      }

      const existingEntry = room.waitingList.find(
        (entry: WaitingListEntry) => normalizeUserId(entry.userId) === userId
      );

      if (existingEntry) {
        await StudyRoom.updateOne(
          {
            _id: room._id,
            "waitingList.userId": userId,
          },
          {
            $set: {
              "waitingList.$.userName": userName,
              "waitingList.$.status": "waiting",
            },
          }
        );
      } else {
        await StudyRoom.updateOne(
          { _id: room._id },
          {
            $push: {
              waitingList: {
                userId,
                userName,
                status: "waiting",
              },
            },
          }
        );
      }

      const updatedRoom = await StudyRoom.findById(room._id).lean();
      const updatedEntry = ((updatedRoom?.waitingList || []) as WaitingListEntry[]).find(
        (entry) => normalizeUserId(entry.userId) === userId
      ) || {
        userId,
        userName,
        status: "waiting",
      };

      if (updatedEntry.status !== "waiting") {
        await StudyRoom.updateOne(
          {
            _id: room._id,
            "waitingList.userId": userId,
          },
          {
            $set: {
              "waitingList.$.status": "waiting",
            },
          }
        );
        updatedEntry.status = "waiting";
      }

      return NextResponse.json({
        success: true,
        roomId,
        entry: {
          userId: normalizeUserId(updatedEntry.userId),
          userName: String(updatedEntry.userName || userName).trim(),
          status: "waiting",
        },
      });
    }

    if (action === "respond") {
      const hostId = resolveRoomHostId(room);

      if (currentUserId !== hostId) {
        return NextResponse.json(
          { message: "Only the room host can respond to waiting users." },
          { status: 403 }
        );
      }

      const targetUserId = normalizeUserId(body.targetUserId);

      if (!targetUserId || (body.status !== "admitted" && body.status !== "declined")) {
        return NextResponse.json(
          { message: "targetUserId and status ('admitted' or 'declined') are required" },
          { status: 400 }
        );
      }

      const existingEntry = room.waitingList.find(
        (entry: WaitingListEntry) => normalizeUserId(entry.userId) === targetUserId
      );

      if (!existingEntry) {
        return NextResponse.json(
          { message: "Waiting user not found" },
          { status: 404 }
        );
      }

      existingEntry.status = body.status;
      await room.save();

      return NextResponse.json({
        success: true,
        roomId,
        entry: existingEntry,
      });
    }

    return NextResponse.json(
      { message: "Invalid action. Use 'knock' or 'respond'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Waiting room POST error:", error);
    return NextResponse.json(
      { message: "Failed to update waiting room." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const roomId = normalizeRoomId(request.nextUrl.searchParams.get("roomId"));

    if (!roomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    const room = await StudyRoom.findOne({
      roomId: { $regex: `^${escapeRegex(roomId)}$`, $options: "i" },
    }).lean();

    if (!room) {
      return NextResponse.json({ message: "Study room not found" }, { status: 404 });
    }

    const hostId = resolveRoomHostId(room);
    const waitingList = ((room.waitingList || []) as WaitingListEntry[]).map((entry) => ({
      userId: normalizeUserId(entry.userId),
      userName: String(entry.userName || "Study Buddy").trim(),
      status: entry.status || "waiting",
    }));

    if (currentUserId === hostId) {
      return NextResponse.json({
        success: true,
        roomId,
        isHost: true,
        waitingList: waitingList.filter((entry) => entry.status === "waiting"),
      });
    }

    const entry =
      waitingList.find((item) => normalizeUserId(item.userId) === currentUserId) ||
      null;

    return NextResponse.json({
      success: true,
      roomId,
      isHost: false,
      entry,
    });
  } catch (error) {
    console.error("Waiting room GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch waiting room." },
      { status: 500 }
    );
  }
}
