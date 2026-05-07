import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import mongoose from "mongoose";

interface RespondBody {
  connectionId?: string;
  action?: "accept" | "decline";
}

// PATCH /api/buddies/requests/respond
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized. Please log in to respond to buddy requests.",
        },
        { status: 401 }
      );
    }

    const { connectionId, action } = (await req.json()) as RespondBody;

    if (!mongoose.Types.ObjectId.isValid(connectionId || "") || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Valid connectionId and action ('accept' | 'decline') are required.",
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
          message: "Buddy request not found.",
        },
        { status: 404 }
      );
    }

    if (String(connection.recipient) !== session.user.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Forbidden. Only the recipient can respond to this buddy request.",
        },
        { status: 403 }
      );
    }

    if (action === "accept") {
      connection.status = "accepted";
      await connection.save();

      return NextResponse.json(
        {
          ok: true,
          message: "Study buddy request accepted successfully.",
          connection,
        },
        { status: 200 }
      );
    }

    // Decline flow: remove pending request record to keep queue clean.
    await BuddyConnection.findByIdAndDelete(connectionId);

    return NextResponse.json(
      {
        ok: true,
        message: "Study buddy request declined successfully.",
        connectionId,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Respond Buddy Request Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error while responding to buddy request.",
      },
      { status: 500 }
    );
  }
}
