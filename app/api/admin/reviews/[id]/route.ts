import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Review, { type ReviewStatus } from "@/models/Review";

export const dynamic = "force-dynamic";

const STATUSES: ReviewStatus[] = ["approved", "rejected"];

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

function normalizeStatus(value: unknown): ReviewStatus | null {
  const normalized = String(value || "").trim().toLowerCase();
  return STATUSES.includes(normalized as ReviewStatus)
    ? (normalized as ReviewStatus)
    : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid review id is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { message: "Status must be approved or rejected." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!review) {
      return NextResponse.json(
        { message: "Review not found." },
        { status: 404 }
      );
    }

    await logActivity({
      actionType: status === "approved" ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
      message: `Admin ${status} a platform review by ${
        (review.userId as any)?.email || (review.userId as any)?.name || "a user"
      }`,
      targetId: String(review._id),
    });

    return NextResponse.json({
      success: true,
      message: `Review ${status}.`,
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { message: "Failed to update review." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid review id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const review = await Review.findByIdAndDelete(id).populate(
      "userId",
      "name email"
    );

    if (!review) {
      return NextResponse.json(
        { message: "Review not found." },
        { status: 404 }
      );
    }

    await logActivity({
      actionType: "REVIEW_DELETED",
      message: `Admin deleted a platform review by ${
        (review.userId as any)?.email || (review.userId as any)?.name || "a user"
      }`,
      targetId: String(review._id),
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted.",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { message: "Failed to delete review." },
      { status: 500 }
    );
  }
}
