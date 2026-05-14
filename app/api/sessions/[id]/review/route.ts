import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorReview from "@/models/MentorReview";
import MentorSession from "@/models/MentorSession";

const MAX_COMMENT_LENGTH = 1000;

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

    const existingReview = await MentorReview.findOne({ sessionId: id }).select(
      "_id"
    );

    if (existingReview) {
      return NextResponse.json(
        { message: "A review has already been submitted for this session." },
        { status: 409 }
      );
    }

    const mentorReview = await MentorReview.create({
      sessionId: mentorSession._id,
      studentId: mentorSession.studentId,
      mentorId: mentorSession.mentorId,
      rating: normalizedRating,
      comment: normalizedComment,
    });

    const mentorReviews = await MentorReview.find({
      mentorId: mentorSession.mentorId,
    })
      .select("rating")
      .lean();

    const totalRating = mentorReviews.reduce(
      (sum, review) => sum + Number(review.rating ?? 0),
      0
    );
    const averageRating =
      mentorReviews.length > 0
        ? Math.round((totalRating / mentorReviews.length) * 10) / 10
        : 0;

    const updatedMentorProfile = await MentorProfile.findOneAndUpdate(
      { userId: mentorSession.mentorId },
      {
        $set: { rating: averageRating },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        message: "Review submitted successfully!",
        review: mentorReview,
        session: mentorSession,
        mentorProfile: updatedMentorProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit mentor review error:", error);
    return NextResponse.json(
      { message: "Failed to submit review" },
      { status: 500 }
    );
  }
}
