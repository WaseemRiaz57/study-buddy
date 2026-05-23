import mongoose from "mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";

export const CHAT_USER_SELECT = "name image profileImage role lastActive";

export function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function toObjectId(value: string) {
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

export function serializeChatUser(user: any) {
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

export function serializeChatMessage(message: any) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(
      typeof message.senderId === "object" && message.senderId?._id
        ? message.senderId._id
        : message.senderId
    ),
    text: message.text || "",
    type: message.type || "text",
    metadata: message.metadata && typeof message.metadata === "object"
      ? message.metadata
      : {},
    isRead: Boolean(message.isRead),
    createdAt: message.createdAt || null,
    sender:
      typeof message.senderId === "object" && message.senderId?._id
        ? serializeChatUser(message.senderId)
        : null,
  };
}

export async function findOrCreateConversation(
  currentUserId: string,
  otherUserId: string
) {
  if (currentUserId === otherUserId) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const otherUser = await User.findById(otherUserId).select(CHAT_USER_SELECT).lean();

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
    .populate("participants", CHAT_USER_SELECT)
    .lean();
}

export async function serializeChatConversation(
  conversation: any,
  currentUserId: string
) {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
  const otherParticipant =
    participants.find(
      (participant: any) => String(participant?._id || participant) !== currentUserId
    ) || participants[0];

  const mapUnreadCount =
    typeof conversation.unreadCounts?.get === "function"
      ? conversation.unreadCounts.get(currentUserId)
      : conversation.unreadCounts?.[currentUserId];
  const unreadCount =
    typeof mapUnreadCount === "number"
      ? mapUnreadCount
      : await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: toObjectId(currentUserId) },
          isRead: false,
          deletedFor: { $ne: toObjectId(currentUserId) },
        });
  const blockedBy = Array.isArray(conversation.blockedBy)
    ? conversation.blockedBy.map((userId: unknown) => String(userId))
    : [];

  return {
    id: String(conversation._id),
    otherParticipant: serializeChatUser(otherParticipant),
    lastMessage: conversation.lastMessage || "",
    lastMessageAt:
      conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    unreadCount,
    isBlockedByMe: blockedBy.includes(currentUserId),
    isBlockedByOther: blockedBy.includes(String(otherParticipant?._id || otherParticipant || "")),
  };
}
