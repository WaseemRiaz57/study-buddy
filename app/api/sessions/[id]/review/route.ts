import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorReview from "@/models/MentorReview";
import MentorSession from "@/models/MentorSession";

const MAX_COMMENT_LENGTH = 1000;

type RatingAggregate = {
  _id: mongoose.Types.ObjectId;
  averageRating: number;
  totalReviews: number;
};

function normalizeRating(rating: unknown): number | null {
  const normalizedRating = Number(rating);

  if (!Number.isInteger(normalizedRating)) {
    return null;
  }

  if (normalizedRating < 1 || normalizedRating > 5) {
    return null;
  }

  return normalizedRating;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();
    if (userRole !== "student") {
      return NextResponse.json(
        { message: "Forbidden. Only students can submit reviews." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and student ids are required." },
        { status: 400 }
      );
    }

    const { rating, comment } = await request.json();
    const normalizedRating = normalizeRating(rating);
    const normalizedComment = String(comment ?? "")
      .trim()
      .slice(0, MAX_COMMENT_LENGTH);

    if (!normalizedRating) {
      return NextResponse.json(
        { message: "rating must be an integer from 1 to 5." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSession = await MentorSession.findById(id);

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Session not found." },
        { status: 404 }
      );
    }

    if (String(mentorSession.studentId) !== session.user.id) {
      return NextResponse.json(
        { message: "Only the student for this session can submit a review." },
        { status: 403 }
      );
    }

    if (mentorSession.status !== "completed") {
      return NextResponse.json(
        { message: "Reviews can only be submitted for completed sessions." },
        { status: 400 }
      );
    }

    const existingReview = await MentorReview.findOne({ sessionId: id }).select(
      "_id"
    );

    if (existingReview) {
      return NextResponse.json(
        { message: "A review has already been submitted for this session." },
        { status: 400 }
      );
    }

    const mentorReview = await MentorReview.create({
      sessionId: mentorSession._id,
      studentId: mentorSession.studentId,
      mentorId: mentorSession.mentorId,
      rating: normalizedRating,
      comment: normalizedComment,
    });

    const [ratingAggregate] = await MentorReview.aggregate<RatingAggregate>([
      { $match: { mentorId: mentorSession.mentorId } },
      {
        $group: {
          _id: "$mentorId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const averageRating = ratingAggregate
      ? Math.round(Number(ratingAggregate.averageRating ?? 0) * 10) / 10
      : 0;
    const totalReviews = ratingAggregate?.totalReviews ?? 0;

    const updatedMentorProfile = await MentorProfile.findOneAndUpdate(
      { userId: mentorSession.mentorId },
      {
        $set: { rating: averageRating, totalReviews },
        $setOnInsert: { userId: mentorSession.mentorId },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully!",
        review: mentorReview,
        session: mentorSession,
        mentorProfile: updatedMentorProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "A review has already been submitted for this session." },
        { status: 400 }
      );
    }

    console.error("Submit mentor review error:", error);
    return NextResponse.json(
      { message: "Failed to submit review" },
      { status: 500 }
    );
  }
}


