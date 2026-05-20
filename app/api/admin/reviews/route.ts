import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { error: null };
}

function formatRole(role: unknown) {
  const normalized = String(role || "student").toLowerCase();
  if (normalized === "teacher" || normalized === "mentor") return "Mentor";
  if (normalized === "admin") return "Admin";
  return "Student";
}

function serializeReview(review: any) {
  const user = review.userId || {};

  return {
    id: String(review._id),
    rating: review.rating || 0,
    comment: review.comment || "",
    status: review.status || "pending",
    createdAt: review.createdAt || null,
    updatedAt: review.updatedAt || null,
    user: {
      id: user._id ? String(user._id) : "",
      name: user.name || "Deleted User",
      email: user.email || "",
      image: user.image || user.profileImage || "",
      role: formatRole(user.role),
    },
  };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectMongoDB();

    const reviews = await Review.find({})
      .populate("userId", "name email role image profileImage")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      reviews: reviews.map(serializeReview),
    });
  } catch (error) {
    console.error("Fetch admin reviews error:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}
