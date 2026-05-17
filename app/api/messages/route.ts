import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const USER_SELECT = "name image profileImage role lastActive";

function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function getUserImage(user: any) {
  return user?.profileImage || user?.image || "";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SB"
  );
}

function serializeUser(user: any) {
  const name = user?.name || "Study Buddy";

  return {
    id: String(user?._id || ""),
    name,
    image: getUserImage(user),
    initials: getInitials(name),
    role: user?.role || "student",
    lastActive: user?.lastActive || null,
  };
}

function serializeMessage(message: any) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(
      typeof message.senderId === "object" && message.senderId?._id
        ? message.senderId._id
        : message.senderId
    ),
    text: message.text || "",
    isRead: Boolean(message.isRead),
    createdAt: message.createdAt || null,
    sender:
      typeof message.senderId === "object" && message.senderId?._id
        ? serializeUser(message.senderId)
        : null,
  };
}

async function findOrCreateConversation(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const otherUser = await User.findById(otherUserId).select(USER_SELECT).lean();

  if (!otherUser) {
    throw new Error("User not found.");
  }

  const participants = [toObjectId(currentUserId), toObjectId(otherUserId)];
  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      lastMessage: "",
      lastMessageAt: new Date(),
    });
  }

  return Conversation.findById(conversation._id)
    .populate("participants", USER_SELECT)
    .lean();
}

async function serializeConversation(conversation: any, currentUserId: string) {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
  const otherParticipant =
    participants.find((participant: any) => String(participant?._id || participant) !== currentUserId) ||
    participants[0];

  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    senderId: { $ne: toObjectId(currentUserId) },
    isRead: false,
  });

  return {
    id: String(conversation._id),
    otherParticipant: serializeUser(otherParticipant),
    lastMessage: conversation.lastMessage || "",
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    unreadCount,
  };
}

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = String(session?.user?.id || "");

  if (!userId || !isValidObjectId(userId)) {
    return null;
  }

  return userId;
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

      const messages = await Message.find({ conversationId })
        .populate("senderId", USER_SELECT)
        .sort({ createdAt: 1 })
        .lean();

      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: toObjectId(currentUserId) },
          isRead: false,
        },
        { $set: { isRead: true } }
      );

      return NextResponse.json({
        messages: messages.map(serializeMessage),
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
        conversation: await serializeConversation(conversation, currentUserId),
      });
    }

    const conversations = await Conversation.find({
      participants: toObjectId(currentUserId),
    })
      .populate("participants", USER_SELECT)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const serialized = await Promise.all(
      conversations.map((conversation) =>
        serializeConversation(conversation, currentUserId)
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

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: currentUserId,
      text,
      isRead: false,
    });

    const now = new Date();
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        $set: {
          lastMessage: text,
          lastMessageAt: now,
        },
      },
      { new: true }
    )
      .populate("participants", USER_SELECT)
      .lean();

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", USER_SELECT)
      .lean();

    return NextResponse.json(
      {
        message: serializeMessage(populatedMessage || message),
        conversation: updatedConversation
          ? await serializeConversation(updatedConversation, currentUserId)
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


