import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isValidObjectId, toObjectId } from "@/lib/chat";
import { connectMongoDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "");

    if (!currentUserId || !isValidObjectId(currentUserId)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const conversationIds = await Conversation.find({
      participants: toObjectId(currentUserId),
    }).distinct("_id");

    if (conversationIds.length === 0) {
      return NextResponse.json({ unreadConversations: 0 });
    }

    const unreadConversations = await Message.distinct("conversationId", {
      conversationId: { $in: conversationIds },
      senderId: { $ne: toObjectId(currentUserId) },
      isRead: false,
    });

    return NextResponse.json({
      unreadConversations: unreadConversations.length,
    });
  } catch (error) {
    console.error("Unread messages count error:", error);
    return NextResponse.json(
      { message: "Failed to load unread messages count." },
      { status: 500 }
    );
  }
}
