import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import StudentProfile from "@/models/StudentProfile";

export const dynamic = "force-dynamic";

type PopulatedStudent = {
  _id?: unknown;
  name?: string;
  image?: string;
  email?: string;
  role?: string;
  isOnline?: boolean;
};

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const subject = String(
    searchParams.get("subject") ||
      searchParams.get("query") ||
      searchParams.get("search") ||
      ""
  )
    .trim()
    .slice(0, 100);

  if (!subject) {
    return NextResponse.json(
      { message: "A subject, query, or search parameter is required." },
      { status: 400 }
    );
  }

  try {
    await connectMongoDB();

    const subjectMatcher = new RegExp(escapeRegex(subject), "i");
    const matchedProfiles = await StudentProfile.find({
      userId: { $ne: session!.user.id },
      interestedSubjects: subjectMatcher,
    })
      .populate("userId", "name image email role isOnline")
      .sort({ updatedAt: -1 })
      .lean();

    const buddies = matchedProfiles.flatMap((profile) => {
      const user =
        profile.userId && typeof profile.userId === "object"
          ? (profile.userId as PopulatedStudent)
          : null;

      if (!user || String(user.role).toLowerCase() !== "student") {
        return [];
      }

      return {
        _id: String(user._id),
        id: String(user._id),
        name: user.name || "Study Buddy",
        image: user.image || "",
        email: user.email || "",
        isOnline: Boolean(user.isOnline),
        subjects: profile.interestedSubjects || [],
        interestedSubjects: profile.interestedSubjects || [],
      };
    });

    return NextResponse.json({
      subject,
      matches: buddies,
    });
  } catch (error) {
    console.error("Buddies Search Error:", error);
    return NextResponse.json(
      { message: "Internal server error while searching buddies." },
      { status: 500 }
    );
  }
}
