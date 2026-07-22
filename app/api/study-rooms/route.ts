import { NextResponse, type NextRequest } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import { getUserSubscriptionPlan, upgradeRequiredResponse } from "@/lib/subscriptionAccess";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CreateStudyRoomBody {
  roomId: string;
  title: string;
  maxParticipants?: number;
}

const LIVE_ROOM_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Records created before roomType was introduced are accepted only when they
// do not match either of the legacy Mentor or Study Buddy identifiers.
const genericStudyRoomFilter = {
  $or: [
    { roomType: "study_room" },
    {
      roomType: { $exists: false },
      $nor: [
        { roomId: /^[a-f\d]{24}$/i },
        { title: /^Mentor Session$/i },
        { title: /^Study Buddy Session$/i },
      ],
      // Both older generic rooms and Buddy rooms used the SB- prefix. Legacy
      // Buddy creation always used capacity 20, while public rooms used their
      // selected capacity, so keep only records that do not match that pair.
      $or: [
        { roomId: { $not: /^SB-/i } },
        { maxParticipants: { $ne: 20 } },
      ],
    },
  ],
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - LIVE_ROOM_MAX_AGE_MS);

    // A generic room cannot remain live indefinitely. Persist the transition
    // so every consumer sees the same lifecycle state, not just this response.
    await StudyRoom.updateMany(
      {
        $and: [
          genericStudyRoomFilter,
          {
            status: "active",
            isLive: true,
            createdAt: { $lt: oneDayAgo },
          },
        ],
      },
      {
        $set: {
          status: "ended",
          isActive: false,
          isLive: false,
          closedAt: now,
        },
      }
    );

    await StudyRoom.updateMany(
      {
        $and: [
          genericStudyRoomFilter,
          {
            status: "active",
            isLive: true,
          },
          {
            $or: [
              {
                $expr: {
                  $eq: [{ $size: { $ifNull: ["$participants", []] } }, 0],
                },
              },
              {
                $expr: {
                  $not: [{ $in: ["$createdBy", { $ifNull: ["$participants", []] }] }],
                },
              },
            ],
          },
        ],
      },
      {
        $set: {
          status: "ended",
          isActive: false,
          isLive: false,
          closedAt: new Date(),
        },
      }
    );

    const currentUserId = String(session.user.id);
    const rooms = await StudyRoom.find({
      $and: [
        genericStudyRoomFilter,
        { status: { $in: ["active", "ended"] } },
      ],
    })
      .populate("createdBy", "name image profileImage")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: rooms.map((room) => {
        const participantCount = Array.isArray(room.participants)
          ? room.participants.length
          : 0;
        const populatedHost = room.createdBy as unknown as
          | { _id?: unknown }
          | mongoose.Types.ObjectId;
        const hostId = String(
          populatedHost && typeof populatedHost === "object" && "_id" in populatedHost
            ? populatedHost._id
            : populatedHost || ""
        );
        const isLive = Boolean(
          room.isLive === true &&
            room.isActive === true &&
            room.status === "active" &&
            participantCount > 0 &&
            room.createdAt >= oneDayAgo
        );

        return {
          ...room,
          roomType: "study_room",
          isLive,
          isActive: isLive,
          status: isLive ? "active" : "ended",
          isHost: hostId === currentUserId,
          participantCount,
          participantsCount: participantCount,
        };
      }),
    });
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
    const plan = await getUserSubscriptionPlan(session.user.id);
    const activeRoomLimit = plan.limits.activeStudyRooms;
    const capacityLimit = plan.limits.studyRoomCapacity;

    if (maxParticipants > capacityLimit) {
      return NextResponse.json(
        upgradeRequiredResponse(
          `${plan.name} study rooms allow up to ${capacityLimit} participants. Upgrade for larger rooms.`
        ),
        { status: 403 }
      );
    }

    if (activeRoomLimit !== null) {
      const activeRooms = await StudyRoom.countDocuments({
        $and: [
          genericStudyRoomFilter,
          {
            createdBy: creatorObjectId,
            isActive: true,
            status: "active",
            createdAt: { $gte: new Date(Date.now() - LIVE_ROOM_MAX_AGE_MS) },
          },
        ],
      });

      if (activeRooms >= activeRoomLimit) {
        return NextResponse.json(
          upgradeRequiredResponse(
            `${plan.name} allows ${activeRoomLimit} active study room${activeRoomLimit === 1 ? "" : "s"}. Upgrade to create more.`
          ),
          { status: 403 }
        );
      }
    }

    const room = await StudyRoom.create({
      roomId: normalizedRoomId,
      roomType: "study_room",
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


