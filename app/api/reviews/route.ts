import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

function normalizeRating(value: unknown) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rating = normalizeRating(body.rating);
    const comment = String(body.comment || "").trim();

    if (!rating) {
      return NextResponse.json(
        { message: "Please select a rating from 1 to 5 stars." },
        { status: 400 }
      );
    }

    if (comment.length < 10 || comment.length > 1200) {
      return NextResponse.json(
        { message: "Review comment must be between 10 and 1200 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const review = await Review.create({
      userId: session.user.id,
      rating,
      comment,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you, your review is pending approval.",
        review: {
          id: String(review._id),
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { message: "Failed to submit review." },
      { status: 500 }
    );
  }
}
