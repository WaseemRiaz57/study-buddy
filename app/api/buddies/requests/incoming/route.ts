import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";

export const dynamic = 'force-dynamic';

// GET /api/buddies/requests/incoming
export async function GET() {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    await connectMongoDB();

    const currentUserId = session!.user.id;

    const incomingRequests = await BuddyConnection.find({
      recipient: currentUserId,
      status: "pending",
    })
      .populate("requester", "name email image subjects")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(incomingRequests, { status: 200 });
  } catch (err) {
    console.error("Incoming Buddy Requests Error:", err);
    return NextResponse.json(
      { message: "Internal server error while fetching incoming requests." },
      { status: 500 }
    );
  }
}