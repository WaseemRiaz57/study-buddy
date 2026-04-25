import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";

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
    const recipientId = body.recipientId?.trim();
    const subject = body.subject?.trim();

    if (!recipientId || !subject) {
      return NextResponse.json(
        { message: "recipientId and subject are required" },
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