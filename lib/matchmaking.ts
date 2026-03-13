import { connectMongoDB } from "@/lib/mongodb";
import { getOnlineStudentIds } from "@/lib/redis";
import User from "@/models/User";
import mongoose from "mongoose";

export interface MatchResult {
  _id: string;
  name: string;
  email: string;
  image?: string;
  subjects: string[];
}

/**
 * UC-12 / FR-6 — FindBuddy Algorithm
 *
 * 1. Try Redis for the set of currently-online student IDs (low-latency).
 * 2. Fall back to MongoDB `isOnline` field when Redis is unavailable.
 * 3. Filter online students whose `subjects` array contains the requested subject.
 * 4. Exclude the requesting student from results.
 */
export async function findBuddy(
  studentId: string,
  subject: string
): Promise<MatchResult[]> {
  await connectMongoDB();

  const onlineIds = await getOnlineStudentIds();

  // ── Build query ──────────────────────────────────────────────────
  const baseFilter: Record<string, unknown> = {
    role: "student",
    subjects: { $regex: new RegExp(`^${escapeRegex(subject)}$`, "i") },
  };

  if (onlineIds) {
    // Redis available — restrict to known-online IDs, excluding self
    const objectIds = onlineIds
      .filter((id) => id !== studentId)
      .map((id) => new mongoose.Types.ObjectId(id));

    baseFilter._id = { $in: objectIds };
  } else {
    // Fallback — use MongoDB's isOnline flag
    baseFilter._id = { $ne: new mongoose.Types.ObjectId(studentId) };
    baseFilter.isOnline = true;
  }

  const matches = await User.find(baseFilter)
    .select("name email image subjects")
    .lean<MatchResult[]>();

  return matches;
}

/** Escape special regex chars in user input */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
