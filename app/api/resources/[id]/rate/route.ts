import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Resource from "@/models/Resource";

export const dynamic = "force-dynamic";

function hasResourceAccess(resource: any, userId: string) {
  const price = Number(resource.price || 0);

  if (price === 0) return true;
  if (String(resource.uploadedBy || "") === userId) return true;

  return Array.isArray(resource.allowedUsers)
    ? resource.allowedUsers.some((allowedUserId: unknown) => String(allowedUserId) === userId)
    : false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Valid resource id is required." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const score = Number(body.score);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    await connectMongoDB();

    const resource = await Resource.findById(id);

    if (!resource || resource.status !== "approved") {
      return NextResponse.json({ message: "Resource is not available." }, { status: 404 });
    }

    if (!hasResourceAccess(resource, session.user.id)) {
      return NextResponse.json(
        { message: "Unlock this resource before rating it." },
        { status: 403 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const ratings = Array.isArray(resource.ratings) ? resource.ratings : [];
    const existingRating = ratings.find(
      (rating: { userId?: unknown }) => String(rating.userId || "") === session.user.id
    );

    if (existingRating) {
      existingRating.score = score;
    } else {
      ratings.push({ userId: userObjectId, score });
    }

    const averageRating =
      ratings.reduce((total: number, rating: { score?: unknown }) => total + Number(rating.score || 0), 0) /
      Math.max(1, ratings.length);

    resource.ratings = ratings;
    resource.averageRating = Math.round(averageRating * 10) / 10;
    resource.rating = resource.averageRating;
    await resource.save();

    return NextResponse.json({
      success: true,
      message: "Thanks for rating this resource.",
      averageRating: resource.averageRating,
      ratingCount: ratings.length,
    });
  } catch (error) {
    console.error("Rate resource error:", error);
    return NextResponse.json({ message: "Failed to save resource rating." }, { status: 500 });
  }
}
