import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  CHAT_USER_SELECT,
  findOrCreateConversation,
  isValidObjectId,
  serializeChatConversation,
  serializeChatMessage,
  toObjectId,
} from "@/lib/chat";
import { connectMongoDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { isUserInConversationRoom } from "@/lib/study-room-socket";

export const dynamic = "force-dynamic";

const MESSAGE_TYPES = new Set([
  "text",
  "live_session",
  "booking_confirmation",
  "resource_card",
]);

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = String(session?.user?.id || "");

  if (!userId || !isValidObjectId(userId)) {
    return null;
  }

  return userId;
}

function normalizeMessageType(value: unknown) {
  const type = String(value || "text");
  return MESSAGE_TYPES.has(type) ? type : "text";
}

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    const currentUserId = await getSessionUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const conversationId = String(searchParams.get("conversationId") || "");
    const userId = String(searchParams.get("user") || searchParams.get("userId") || "");

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return NextResponse.json(
          { message: "Invalid conversation id." },
          { status: 400 }
        );
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: toObjectId(currentUserId),
      }).select("_id");

      if (!conversation) {
        return NextResponse.json(
          { message: "Conversation not found." },
          { status: 404 }
        );
      }

      const messages = await Message.find({
        conversationId,
        deletedFor: { $ne: toObjectId(currentUserId) },
      })
        .populate("senderId", CHAT_USER_SELECT)
        .sort({ createdAt: 1 })
        .lean();

      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: toObjectId(currentUserId) },
          isRead: false,
          deletedFor: { $ne: toObjectId(currentUserId) },
        },
        { $set: { isRead: true } }
      );
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCounts.${currentUserId}`]: 0 } }
      );

      return NextResponse.json({
        messages: messages.map(serializeChatMessage),
      });
    }

    if (userId) {
      if (!isValidObjectId(userId)) {
        return NextResponse.json(
          { message: "Invalid user id." },
          { status: 400 }
        );
      }

      const conversation = await findOrCreateConversation(currentUserId, userId);

      if (!conversation) {
        return NextResponse.json(
          { message: "Unable to open conversation." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        conversation: await serializeChatConversation(conversation, currentUserId),
      });
    }

    const conversations = await Conversation.find({
      participants: toObjectId(currentUserId),
    })
      .populate("participants", CHAT_USER_SELECT)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const serialized = await Promise.all(
      conversations.map((conversation) =>
        serializeChatConversation(conversation, currentUserId)
      )
    );

    return NextResponse.json({ conversations: serialized });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load messages.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getSessionUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const conversationId = String(body.conversationId || "");
    const receiverId = String(body.receiverId || "");
    const text = String(body.text || "").trim();
    const type = normalizeMessageType(body.type);
    const metadata = normalizeMetadata(body.metadata);

    if (!text || text.length > 4000) {
      return NextResponse.json(
        { message: "Message text must be between 1 and 4000 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    let conversation: any = null;

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return NextResponse.json(
          { message: "Invalid conversation id." },
          { status: 400 }
        );
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: toObjectId(currentUserId),
      });
    } else if (receiverId) {
      if (!isValidObjectId(receiverId)) {
        return NextResponse.json(
          { message: "Invalid receiver id." },
          { status: 400 }
        );
      }

      conversation = await findOrCreateConversation(currentUserId, receiverId);
    }

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found." },
        { status: 404 }
      );
    }

    const participantIds = Array.isArray(conversation.participants)
      ? conversation.participants.map((participant: any) =>
          String(participant?._id || participant)
        )
      : [];
    const receiverUserId =
      participantIds.find((participantId: string) => participantId !== currentUserId) ||
      receiverId;
    const blockedBy = Array.isArray(conversation.blockedBy)
      ? conversation.blockedBy.map((userId: unknown) => String(userId))
      : [];

    if (blockedBy.includes(currentUserId)) {
      return NextResponse.json(
        { message: "You blocked this user. Unblock them before sending a message." },
        { status: 403 }
      );
    }

    if (receiverUserId && blockedBy.includes(receiverUserId)) {
      return NextResponse.json(
        { message: "This user is not accepting messages from you." },
        { status: 403 }
      );
    }

    const receiverInRoom =
      Boolean(receiverUserId) &&
      isUserInConversationRoom(String(conversation._id), receiverUserId);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: currentUserId,
      text,
      type,
      metadata,
      isRead: receiverInRoom,
    });

    const now = new Date();
    const conversationUpdate: Record<string, any> = {
      $set: {
        lastMessage: text,
        lastMessageAt: now,
      },
    };

    if (receiverUserId) {
      if (receiverInRoom) {
        conversationUpdate.$set[`unreadCounts.${receiverUserId}`] = 0;
      } else {
        conversationUpdate.$inc = {
          [`unreadCounts.${receiverUserId}`]: 1,
        };
      }
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversation._id,
      conversationUpdate,
      { new: true }
    )
      .populate("participants", CHAT_USER_SELECT)
      .lean();

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", CHAT_USER_SELECT)
      .lean();

    return NextResponse.json(
      {
        message: serializeChatMessage(populatedMessage || message),
        conversation: updatedConversation
          ? await serializeChatConversation(updatedConversation, currentUserId)
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to send message.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUserId = await getSessionUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = String(searchParams.get("conversationId") || "");

    if (!conversationId || !isValidObjectId(conversationId)) {
      return NextResponse.json(
        { message: "Invalid conversation id." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: toObjectId(currentUserId),
    }).select("_id");

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found." },
        { status: 404 }
      );
    }

    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedFor: toObjectId(currentUserId) } }
    );
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } }
    );

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error("Messages DELETE error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to clear chat.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUserId = await getSessionUserId();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const conversationId = String(body.conversationId || "");
    const action = String(body.action || "").toLowerCase();

    if (!conversationId || !isValidObjectId(conversationId)) {
      return NextResponse.json(
        { message: "Invalid conversation id." },
        { status: 400 }
      );
    }

    if (action !== "block") {
      return NextResponse.json(
        { message: "Unsupported chat action." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        participants: toObjectId(currentUserId),
      },
      { $addToSet: { blockedBy: toObjectId(currentUserId) } },
      { new: true }
    )
      .populate("participants", CHAT_USER_SELECT)
      .lean();

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: await serializeChatConversation(conversation, currentUserId),
    });
  } catch (error) {
    console.error("Messages PATCH error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update chat.",
      },
      { status: 500 }
    );
  }
}


