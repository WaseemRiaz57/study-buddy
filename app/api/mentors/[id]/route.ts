import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorReview from "@/models/MentorReview";
import MentorSession from "@/models/MentorSession";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function serializeAvailability(day: any) {
  const slots = Array.isArray(day?.slots) && day.slots.length
    ? day.slots
    : Array.isArray(day?.timeSlots)
      ? day.timeSlots
      : [];

  return {
    day: String(day?.day || ""),
    slots,
    timeSlots: slots,
  };
}

function serializeReview(review: any) {
  const student =
    review?.studentId && typeof review.studentId === "object"
      ? review.studentId
      : null;

  return {
    id: String(review?._id || ""),
    rating: Number(review?.rating || 0),
    comment: String(review?.comment || "").trim(),
    createdAt: review?.createdAt || null,
    student: {
      id: String(student?._id || review?.studentId || ""),
      name: student?.name || "StudyBuddy Student",
      image: student?.image || "",
    },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid mentor id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorObjectId = new mongoose.Types.ObjectId(id);
    const [mentor, profile, reviews, completedSessions, totalSessions] =
      await Promise.all([
        User.findOne({ _id: mentorObjectId, role: "mentor" })
          .select("_id name email image")
          .lean(),
        MentorProfile.findOne({
          userId: mentorObjectId,
          status: "approved",
          isPublic: true,
        }).lean(),
        MentorReview.find({ mentorId: mentorObjectId })
          .populate("studentId", "name image")
          .sort({ createdAt: -1 })
          .limit(12)
          .lean(),
        MentorSession.countDocuments({
          mentorId: mentorObjectId,
          status: "completed",
        }),
        MentorSession.countDocuments({ mentorId: mentorObjectId }),
      ]);

    if (!mentor || !profile) {
      return NextResponse.json(
        { message: "Mentor profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: String(mentor._id),
      name: mentor.name || "StudyBuddy Mentor",
      email: mentor.email || "",
      image: mentor.image || "",
      headline: profile.headline || "StudyBuddy Mentor",
      bio:
        profile.bio ||
        "This mentor is ready to help students build clarity and momentum.",
      subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
      hourlyRate: Number(profile.hourlyRate || 0),
      rating: Number(profile.rating || 0),
      reviews: Number(profile.totalReviews || reviews.length || 0),
      certificates: Array.isArray(profile.certificates)
        ? profile.certificates
        : [],
      availability: Array.isArray(profile.availability)
        ? profile.availability.map(serializeAvailability)
        : [],
      stats: {
        completedSessions,
        totalSessions,
        totalReviews: Number(profile.totalReviews || reviews.length || 0),
      },
      studentReviews: reviews.map(serializeReview),
    });
  } catch (error) {
    console.error("Fetch mentor profile error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor profile." },
      { status: 500 }
    );
  }
}
