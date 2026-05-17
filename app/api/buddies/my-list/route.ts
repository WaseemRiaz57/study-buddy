import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";

export const dynamic = 'force-dynamic';

// GET /api/buddies/my-list
export async function GET() {
  const { error, session } = await requireRole("student", "mentor", "admin");
  if (error) return error;

  try {
    await connectMongoDB();

    const currentUserId = session!.user.id;

    const connections = await BuddyConnection.find({
      status: "accepted",
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    })
      .populate("requester", "name email image role subjects isOnline")
      .populate("recipient", "name email image role subjects isOnline")
      .sort({ updatedAt: -1 })
      .lean();

    const buddies = connections
      .map((connection) => {
        const requester = connection.requester as {
          _id?: unknown;
          name?: string;
          email?: string;
          image?: string;
          role?: string;
          subjects?: string[];
          isOnline?: boolean;
        } | null;

        const recipient = connection.recipient as {
          _id?: unknown;
          name?: string;
          email?: string;
          image?: string;
          role?: string;
          subjects?: string[];
          isOnline?: boolean;
        } | null;

        if (!requester || !recipient) {
          return null;
        }

        const isCurrentUserRequester = String(requester._id) === currentUserId;
        const otherUser = isCurrentUserRequester ? recipient : requester;

        return {
          connectionId: String(connection._id),
          subject: connection.subject,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
          buddy: {
            id: String(otherUser._id),
            name: otherUser.name || "Unknown",
            email: otherUser.email || "",
            avatar: otherUser.image || "",
            image: otherUser.image || "",
            role: otherUser.role || "student",
            subjects: Array.isArray(otherUser.subjects) ? otherUser.subjects : [],
            isOnline: Boolean(otherUser.isOnline),
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      {
        message: "Active buddies fetched successfully",
        count: buddies.length,
        buddies,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Fetch My Buddies Error:", err);
    return NextResponse.json(
      { message: "Internal server error while fetching buddies" },
      { status: 500 }
    );
  }
}

