import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import Notification from "@/models/Notification";

type MentorReviewStatus = "approved" | "rejected";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeStatus(status: unknown): MentorReviewStatus | null {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (normalizedStatus === "approved" || normalizedStatus === "rejected") {
    return normalizedStatus;
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid mentor profile id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { status?: unknown };
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { message: "status must be either 'approved' or 'rejected'." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const update =
      status === "approved"
        ? { status: "approved", isPublic: true }
        : { status: "rejected", isPublic: false };

    const mentorProfile = await MentorProfile.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!mentorProfile) {
      return NextResponse.json(
        { message: "Mentor profile not found." },
        { status: 404 }
      );
    }

    const notificationMessage =
      status === "approved"
        ? "Congratulations! Your mentor application has been approved. You are now live in the marketplace."
        : "Your mentor application was not approved at this time. Please update your certificates and try again.";

    await Notification.create({
      recipientId: mentorProfile.userId,
      senderId: mongoose.Types.ObjectId.isValid(session.user.id)
        ? new mongoose.Types.ObjectId(session.user.id)
        : null,
      type: "system",
      title:
        status === "approved"
          ? "Mentor Application Approved"
          : "Mentor Application Rejected",
      message: notificationMessage,
      read: false,
      metadata: {
        mentorProfileId: String(mentorProfile._id),
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Mentor application approved."
          : "Mentor application rejected.",
      mentorProfile: {
        id: String(mentorProfile._id),
        status: mentorProfile.status,
        isPublic: mentorProfile.isPublic,
      },
    });
  } catch (error) {
    console.error("Update mentor application status error:", error);
    return NextResponse.json(
      { message: "Failed to update mentor application status." },
      { status: 500 }
    );
  }
}
