import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import BuddyConnection from "@/models/BuddyConnection";
import StudentProfile from "@/models/StudentProfile";
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
 * - accepted buddies
 * - users who sent a pending request to the current user
 * * Includes:
 * - Users to whom current user sent a pending request (marked as requestStatus: "pending")
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

    const currentUserId = session!.user.id;

    // List current user under the searched topic so others can discover them.
    await User.findByIdAndUpdate(currentUserId, {
      currentStudyTopic: subject,
    });

    // User ke saray connections dhoondo
    const existingConnections = await BuddyConnection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    }).lean();

    const excludedUserIds = new Set<string>([currentUserId]);
    const pendingSentUserIds = new Set<string>(); // Jinhe maine request bheji hai

    for (const connection of existingConnections) {
      const requesterId = String(connection.requester);
      const recipientId = String(connection.recipient);

      if (connection.status === "accepted") {
        // Agar dost ban chukay hain toh list se nikal do
        excludedUserIds.add(requesterId);
        excludedUserIds.add(recipientId);
      } else if (connection.status === "pending") {
        if (requesterId === currentUserId) {
          // Maine request bheji hai -> Inko exclude nahi karna, sirf pending mark karna hai
          pendingSentUserIds.add(recipientId);
        } else {
          // Unhon ne mujhe request bheji hai -> Discovery list se nikal do
          excludedUserIds.add(requesterId);
        }
      }
    }

    const subjectMatcher = new RegExp(escapeRegex(subject), "i");
    const matchedProfiles = await StudentProfile.find({
      userId: { $nin: Array.from(excludedUserIds) },
      interestedSubjects: subjectMatcher,
    })
      .populate("userId", "name image email role isOnline currentStudyTopic subjects")
      .sort({ updatedAt: -1 })
      .lean();

    // Frontend ke liye har user ke sath uska "requestStatus" attach karein
    const formattedBuddies = matchedProfiles.flatMap((profile) => {
      const buddy =
        profile.userId && typeof profile.userId === "object"
          ? profile.userId
          : null;

      if (
        !buddy ||
        String(buddy.role).toLowerCase() !== "student" ||
        buddy.isOnline !== true
      ) {
        return [];
      }

      return {
        _id: String(buddy._id),
        name: buddy.name || "Study Buddy",
        email: buddy.email || "",
        image: buddy.image || "",
        subjects: profile.interestedSubjects || [],
        interestedSubjects: profile.interestedSubjects || [],
        currentStudyTopic: buddy.currentStudyTopic || "",
        isOnline: buddy.isOnline,
        requestStatus: pendingSentUserIds.has(String(buddy._id))
          ? "pending"
          : "none",
      };
    });

    return NextResponse.json(
      {
        message:
          formattedBuddies.length > 0
            ? `Found ${formattedBuddies.length} available study buddy match(es).`
            : "No online buddies found for this subject right now.",
        subject,
        matches: formattedBuddies, // Yeh updated array frontend par jayegi
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


