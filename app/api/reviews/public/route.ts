import { NextResponse } from "next/server";
import { isMentorRole } from "@/lib/roles";
import { connectMongoDB } from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

function normalizePublicRole(role: unknown) {
  const normalized = String(role || "student").toLowerCase();
  if (isMentorRole(normalized)) return "mentor";
  return "student";
}

function cleanComment(comment: unknown) {
  return String(comment || "").trim().replace(/^["']|["']$/g, "");
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function serializeReview(review: any) {
  const user = review.userId || {};
  const name = user.name || "StudyBuddy User";

  return {
    id: String(review._id),
    rating: review.rating || 5,
    comment: cleanComment(review.comment),
    createdAt: review.createdAt || null,
    user: {
      id: user._id ? String(user._id) : "",
      name,
      role: normalizePublicRole(user.role),
      image: user.image || user.profileImage || "",
      initials: initials(name),
    },
  };
}

export async function GET() {
  try {
    await connectMongoDB();

    const reviews = await Review.find({ status: "approved" })
      .populate("userId", "name role image profileImage")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      reviews: reviews.map(serializeReview),
    });
  } catch (error) {
    console.error("Fetch public reviews error:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}
