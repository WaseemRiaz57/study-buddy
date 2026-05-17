import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import mongoose from "mongoose";

interface EndRequestBody {
  connectionId?: string;
}

// PATCH /api/buddies/requests/end
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized. Please log in to end this session.",
        },
        { status: 401 }
      );
    }

    const { connectionId } = (await req.json()) as EndRequestBody;

    if (!mongoose.Types.ObjectId.isValid(connectionId || "")) {
      return NextResponse.json(
        {
          ok: false,
          message: "Valid connectionId is required.",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connection = await BuddyConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json(
        {
          ok: false,
          message: "Buddy connection not found.",
        },
        { status: 404 }
      );
    }

    const currentUserId = session.user.id;
    const isParticipant =
      String(connection.requester) === currentUserId ||
      String(connection.recipient) === currentUserId;

    if (!isParticipant) {
      return NextResponse.json(
        {
          ok: false,
          message: "Forbidden. You are not a participant of this connection.",
        },
        { status: 403 }
      );
    }

    connection.status = "completed";
    await connection.save();

    return NextResponse.json(
      {
        ok: true,
        message: "Session marked as completed successfully.",
        connection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("End Buddy Session Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error while ending session.",
      },
      { status: 500 }
    );
  }
}


