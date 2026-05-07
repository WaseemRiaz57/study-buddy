import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { RoomServiceClient } from "livekit-server-sdk";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ModerationAction = "mute" | "remove";

type ModerationBody = {
  action?: ModerationAction;
  participantIdentity?: string;
  trackSid?: string;
  muted?: boolean;
};

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLiveKitService() {
  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const liveKitApiKey = process.env.LIVEKIT_API_KEY;
  const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
    return null;
  }

  return new RoomServiceClient(liveKitUrl, liveKitApiKey, liveKitApiSecret);
}

async function resolveMicrophoneTrackSid(
  roomService: RoomServiceClient,
  roomName: string,
  participantIdentity: string
): Promise<string | null> {
  const participant = await roomService.getParticipant(roomName, participantIdentity);
  const tracks = (participant.tracks || []) as Array<{
    sid?: string;
    source?: unknown;
    type?: unknown;
    name?: string;
  }>;

  const microphoneTrack =
    tracks.find((track) => String(track.source).toLowerCase().includes("microphone")) ||
    tracks.find((track) => String(track.name || "").toLowerCase().includes("microphone")) ||
    tracks.find((track) => String(track.type).toLowerCase().includes("audio"));

  return microphoneTrack?.sid || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = String(session?.user?.id || "").trim();

    if (!requesterId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const roomName = normalizeRoomId(roomId);

    if (!roomName) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    const body = (await request.json()) as ModerationBody;
    const action = body.action;
    const participantIdentity = String(body.participantIdentity || "").trim();

    if (action !== "mute" && action !== "remove") {
      return NextResponse.json({ message: "Invalid moderation action" }, { status: 400 });
    }

    if (!participantIdentity) {
      return NextResponse.json(
        { message: "participantIdentity is required" },
        { status: 400 }
      );
    }

    if (participantIdentity === requesterId) {
      return NextResponse.json(
        { message: "Hosts cannot moderate themselves" },
        { status: 400 }
      );
    }

    await connectDB();

    const room = await StudyRoom.findOne({
      roomId: { $regex: `^${escapeRegex(roomName)}$`, $options: "i" },
    }).lean();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    const hostId = String((room as { createdBy?: unknown }).createdBy || "").trim();

    if (!hostId || hostId !== requesterId) {
      return NextResponse.json(
        { message: "Forbidden: only the host can moderate participants" },
        { status: 403 }
      );
    }

    const roomService = getLiveKitService();

    if (!roomService) {
      return NextResponse.json({ message: "LiveKit config missing" }, { status: 500 });
    }

    if (action === "remove") {
      await roomService.removeParticipant(roomName, participantIdentity);

      return NextResponse.json({
        message: "Participant removed",
        participantIdentity,
      });
    }

    const trackSid =
      String(body.trackSid || "").trim() ||
      (await resolveMicrophoneTrackSid(roomService, roomName, participantIdentity));

    if (!trackSid) {
      return NextResponse.json(
        { message: "No microphone track found for participant" },
        { status: 404 }
      );
    }

    const muted = body.muted ?? true;
    const track = await roomService.mutePublishedTrack(
      roomName,
      participantIdentity,
      trackSid,
      muted
    );

    return NextResponse.json({
      message: muted ? "Participant muted" : "Participant unmuted",
      participantIdentity,
      trackSid,
      muted,
      track,
    });
  } catch (error) {
    console.error("LiveKit moderation error:", error);
    return NextResponse.json(
      { message: "Failed to moderate participant" },
      { status: 500 }
    );
  }
}
