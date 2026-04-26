import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";

export const dynamic = 'force-dynamic';

// GET /api/buddies/requests/accepted
export async function GET() {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    await connectMongoDB();

    const connection = await BuddyConnection.findOne({
      requester: session!.user.id,
      status: "accepted",
    })
      .populate("recipient", "name email image subjects")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        ok: true,
        connection: connection || null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Accepted Request Fetch Error:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error while fetching accepted requests.",
      },
      { status: 500 }
    );
  }
}