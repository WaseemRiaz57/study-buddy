import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection, {
  type BuddyConnectionStatus,
} from "@/models/BuddyConnection";

interface PatchRequestBody {
  status?: BuddyConnectionStatus;
}

// PATCH /api/buddies/request/[requestId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const { requestId } = await params;
    const requesterAction = (await req.json()) as PatchRequestBody;
    const nextStatus = requesterAction.status;

    if (!requestId?.trim()) {
      return NextResponse.json(
        { message: "requestId is required" },
        { status: 400 }
      );
    }

    if (nextStatus !== "accepted" && nextStatus !== "rejected") {
      return NextResponse.json(
        { message: "status must be either 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connection = await BuddyConnection.findById(requestId);
    if (!connection) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    const currentUserId = session!.user.id;
    if (String(connection.recipient) !== currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    connection.status = nextStatus;
    await connection.save();

    return NextResponse.json(
      {
        message: `Request ${nextStatus}`,
        connection,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Buddy Request Update Error:", err);
    return NextResponse.json(
      { message: "Internal server error while updating request" },
      { status: 500 }
    );
  }
}