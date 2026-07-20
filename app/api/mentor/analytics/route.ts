import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorReview from "@/models/MentorReview";
import { isMentorRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isMentorRole(session.user.role)) {
      return NextResponse.json({ message: "Mentor access required." }, { status: 403 });
    }

    await connectMongoDB();

    const mentorId = new mongoose.Types.ObjectId(session.user.id);
    const today = startOfDay(new Date());
    const windowStart = new Date(today);
    windowStart.setDate(today.getDate() - 6);
    const previousWindowStart = new Date(windowStart);
    previousWindowStart.setDate(windowStart.getDate() - 7);

    const [currentReviews, previousReviews] = await Promise.all([
      MentorReview.find({
        mentorId,
        createdAt: { $gte: windowStart },
      })
        .select("rating createdAt")
        .lean(),
      MentorReview.find({
        mentorId,
        createdAt: { $gte: previousWindowStart, $lt: windowStart },
      })
        .select("rating")
        .lean(),
    ]);

    const dailyScores = new Map<string, { total: number; count: number }>();
    for (const review of currentReviews) {
      const key = dayKey(new Date(review.createdAt));
      const current = dailyScores.get(key) || { total: 0, count: 0 };
      dailyScores.set(key, {
        total: current.total + Number(review.rating || 0) * 20,
        count: current.count + 1,
      });
    }

    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(windowStart);
      date.setDate(windowStart.getDate() + index);
      const value = dailyScores.get(dayKey(date));

      return {
        label: dayLabel(date),
        value: value?.count ? Math.round(value.total / value.count) : 0,
      };
    });

    const currentAverage = currentReviews.length
      ? currentReviews.reduce(
          (total, review) => total + Number(review.rating || 0) * 20,
          0
        ) / currentReviews.length
      : 0;
    const previousAverage = previousReviews.length
      ? previousReviews.reduce(
          (total, review) => total + Number(review.rating || 0) * 20,
          0
        ) / previousReviews.length
      : 0;

    return NextResponse.json({
      hasData: currentReviews.length > 0,
      avgStudentScore: Math.round(currentAverage * 10) / 10,
      delta: Math.round((currentAverage - previousAverage) * 10) / 10,
      points,
    });
  } catch (error) {
    console.error("Mentor analytics error:", error);
    return NextResponse.json(
      { message: "Failed to load mentor analytics." },
      { status: 500 }
    );
  }
}
