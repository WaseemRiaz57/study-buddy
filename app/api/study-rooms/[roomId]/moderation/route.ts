import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  removeLiveKitParticipant,
  setLiveKitParticipantMicrophoneMuted,
} from "@/lib/livekit-moderation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ModerationAction = "mute" | "remove";

type ModerationBody = {
  action?: ModerationAction;
  participantIdentity?: string;
  trackSid?: string;
  muted?: boolean;
};

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
    const roomName = roomId.trim().toUpperCase();

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

    if (action === "remove") {
      await removeLiveKitParticipant({
        roomId: roomName,
        requesterId,
        participantIdentity,
      });

      return NextResponse.json({
        message: "Participant removed",
        participantIdentity,
      });
    }

    const muted = body.muted ?? true;
    const result = await setLiveKitParticipantMicrophoneMuted({
      roomId: roomName,
      requesterId,
      participantIdentity,
      trackSid: String(body.trackSid || "").trim(),
      muted,
    });

    return NextResponse.json({
      message: muted ? "Participant muted" : "Participant unmuted",
      participantIdentity,
      trackSid: result.trackSid,
      muted,
    });
  } catch (error) {
    console.error("LiveKit moderation error:", error);
    return NextResponse.json(
      { message: "Failed to moderate participant" },
      { status: 500 }
    );
  }
}
