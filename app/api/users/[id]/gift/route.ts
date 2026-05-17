import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import Notification from "@/models/Notification";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const MAX_GIFT_AMOUNT = 100000;

function getProfileModel(role: unknown) {
  const normalizedRole = String(role || "").toLowerCase();
  return normalizedRole === "teacher" || normalizedRole === "mentor"
    ? MentorProfile
    : StudentProfile;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: receiverId } = await params;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json(
        { message: "Valid receiver id is required." },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { message: "You cannot gift coins to yourself." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);

    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_GIFT_AMOUNT) {
      return NextResponse.json(
        { message: `Amount must be an integer between 1 and ${MAX_GIFT_AMOUNT}.` },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const [sender, receiver] = await Promise.all([
      User.findById(session.user.id).select("name role").lean(),
      User.findById(receiverId).select("name role").lean(),
    ]);

    if (!sender || !receiver) {
      return NextResponse.json(
        { message: "Sender or receiver was not found." },
        { status: 404 }
      );
    }

    const SenderProfileModel = getProfileModel(sender.role);
    const ReceiverProfileModel = getProfileModel(receiver.role);
    const senderObjectId = new mongoose.Types.ObjectId(session.user.id);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const updatedSenderProfile = await SenderProfileModel.findOneAndUpdate(
      {
        userId: senderObjectId,
        coins: { $gte: amount },
      },
      { $inc: { coins: -amount } },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedSenderProfile) {
      return NextResponse.json(
        { message: "Not enough coins to send this gift." },
        { status: 400 }
      );
    }

    const updatedReceiverProfile = await ReceiverProfileModel.findOneAndUpdate(
      { userId: receiverObjectId },
      {
        $setOnInsert: { userId: receiverObjectId },
        $inc: { coins: amount },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    await Promise.allSettled([
      logActivity({
        actionType: "COINS_GIFTED",
        message: `${sender.name || "User"} gifted ${amount} coins to ${receiver.name || "User"}`,
        targetId: receiverId,
      }),
      Notification.create({
        userId: receiverObjectId,
        recipientId: receiverObjectId,
        senderId: senderObjectId,
        type: "system",
        title: "Coins Gifted",
        message: `${sender.name || "Someone"} gifted you ${amount} coins! \u{1F381}`,
        read: false,
        metadata: {
          amount,
          senderId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Gifted ${amount} coins to ${receiver.name || "user"}.`,
      sender: {
        coins: Number(updatedSenderProfile.coins || 0),
      },
      receiver: {
        coins: Number(updatedReceiverProfile?.coins || amount),
      },
    });
  } catch (error) {
    console.error("Gift coins error:", error);
    return NextResponse.json(
      { message: "Failed to gift coins." },
      { status: 500 }
    );
  }
}
