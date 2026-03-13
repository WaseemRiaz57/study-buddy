import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { findBuddy } from "@/lib/matchmaking";

/**
 * GET /api/study-buddy/find?subject=Mathematics
 *
 * Triggers the FindBuddy matchmaking algorithm (UC-12 / FR-6).
 * Restricted to students only — mentors should use "My Students" instead.
 */
export async function GET(req: NextRequest) {
  // ── Role check (students only) ──────────────────────────────────
  const { error, session } = await requireRole("student");
  if (error) return error;

  // ── Validate query params ────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");

  if (!subject || subject.trim().length === 0) {
    return NextResponse.json(
      { message: "Query parameter 'subject' is required." },
      { status: 400 }
    );
  }

  try {
    const studentId = session!.user.id;
    const matches = await findBuddy(studentId, subject.trim());

    return NextResponse.json(
      {
        message:
          matches.length > 0
            ? `Found ${matches.length} study buddy match(es).`
            : "No online buddies found for this subject right now.",
        matches,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("FindBuddy Error:", err);
    return NextResponse.json(
      { message: "Internal server error while finding buddies." },
      { status: 500 }
    );
  }
}
