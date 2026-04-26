import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/buddies/discover?subject=Math
 *
 * Returns online students for a subject excluding:
 * - current user
 * - users already linked with current user via pending/accepted BuddyConnection
 */
export async function GET(req: NextRequest) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const rawSubject = searchParams.get("subject");
  const subject = rawSubject?.trim();

  if (!subject) {
    return NextResponse.json(
      { message: "Query parameter 'subject' is required." },
      { status: 400 }
    );
  }

  try {
    await connectMongoDB();
    console.log("[Buddies Discover] Subject received:", subject);

    const currentUserId = session!.user.id;

    // List current user under the searched topic so others can discover them.
    await User.findByIdAndUpdate(currentUserId, {
      currentStudyTopic: subject,
    });

    const subjectMatcher = new RegExp(escapeRegex(subject), "i");
    const interestQuery = {
      $or: [
        { subjects: subjectMatcher },
        { currentStudyTopic: subjectMatcher },
      ],
    };

    const totalUsersBeforeFiltering = await User.countDocuments({
      role: "student",
      isOnline: true,
      ...interestQuery,
    });
    console.log(
      "[Buddies Discover] Total users found before exclusion filtering:",
      totalUsersBeforeFiltering
    );

    const existingConnections = await BuddyConnection.find(
      {
        status: { $in: ["pending", "accepted"] },
        $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      },
      { requester: 1, recipient: 1 }
    ).lean();

    const excludedUserIds = new Set<string>([currentUserId]);

    for (const connection of existingConnections) {
      const requesterId = String(connection.requester);
      const recipientId = String(connection.recipient);
      excludedUserIds.add(requesterId);
      excludedUserIds.add(recipientId);
    }

    const buddies = await User.find(
      {
        _id: { $nin: Array.from(excludedUserIds) },
        role: "student",
        isOnline: true,
        ...interestQuery,
      },
      {
        name: 1,
        email: 1,
        image: 1,
        subjects: 1,
        isOnline: 1,
      }
    )
      .sort({ updatedAt: -1 })
      .lean();

    console.log("[Buddies Discover] Buddies after exclusion filtering:", buddies.length);

    return NextResponse.json(
      {
        message:
          buddies.length > 0
            ? `Found ${buddies.length} available study buddy match(es).`
            : "No online buddies found for this subject right now.",
        subject,
        matches: buddies,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Buddies Discover Error:", err);
    return NextResponse.json(
      { message: "Internal server error while discovering buddies." },
      { status: 500 }
    );
  }
}