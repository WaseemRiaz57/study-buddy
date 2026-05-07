import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import User from "@/models/User";
import mongoose from "mongoose";

interface RequestBody {
  recipientId?: string;
  subject?: string;
}

// POST /api/buddies/request
export async function POST(req: Request) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const body = (await req.json()) as RequestBody;
    const recipientId = String(body.recipientId || "").trim();
    const subject = String(body.subject || "").trim().slice(0, 100);

    if (!mongoose.Types.ObjectId.isValid(recipientId) || !subject) {
      return NextResponse.json(
        { message: "Valid recipientId and subject are required" },
        { status: 400 }
      );
    }

    const requesterId = session!.user.id;

    if (requesterId === recipientId) {
      return NextResponse.json(
        { message: "You cannot send a request to yourself" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const recipient = await User.findOne({ _id: recipientId, role: "student" }).select("_id");
    if (!recipient) {
      return NextResponse.json(
        { message: "Recipient not found or unavailable" },
        { status: 404 }
      );
    }

    const existingConnection = await BuddyConnection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
      status: { $in: ["pending", "accepted", "rejected"] },
    }).lean();

    if (existingConnection) {
      return NextResponse.json(
        { message: "Request already exists" },
        { status: 400 }
      );
    }

    const createdConnection = await BuddyConnection.create({
      requester: requesterId,
      recipient: recipientId,
      subject,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Buddy request sent successfully",
        connection: createdConnection,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Buddy Request Error:", err);
    return NextResponse.json(
      { message: "Internal server error while sending request" },
      { status: 500 }
    );
  }
}
