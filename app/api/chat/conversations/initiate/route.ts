import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  findOrCreateConversation,
  isValidObjectId,
  serializeChatConversation,
} from "@/lib/chat";
import { connectMongoDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "");

    if (!currentUserId || !isValidObjectId(currentUserId)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = String(body.targetUserId || body.userId || "").trim();

    if (!targetUserId || !isValidObjectId(targetUserId)) {
      return NextResponse.json(
        { message: "A valid target user id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const conversation = await findOrCreateConversation(currentUserId, targetUserId);

    if (!conversation) {
      return NextResponse.json(
        { message: "Unable to open conversation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversationId: String(conversation._id),
      conversation: await serializeChatConversation(conversation, currentUserId),
    });
  } catch (error) {
    console.error("Initiate conversation error:", error);
    return NextResponse.json(
      { message: "Failed to initiate conversation." },
      { status: 500 }
    );
  }
}
