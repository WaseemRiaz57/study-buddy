import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

const MAX_RECEIPT_LENGTH = 3 * 1024 * 1024;

function normalizeReceipt(value: unknown) {
  const receipt = String(value ?? "").trim();

  if (!receipt || receipt.length > MAX_RECEIPT_LENGTH) {
    return null;
  }

  if (!receipt.startsWith("data:image/") && !receipt.startsWith("data:application/pdf")) {
    return null;
  }

  return receipt;
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

    const userRole = String(session.user.role ?? "").toLowerCase();
    if (userRole !== "student") {
      return NextResponse.json(
        { message: "Forbidden. Only students can upload payment receipts." },
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

    const body = (await request.json()) as { paymentReceipt?: unknown };
    const paymentReceipt = normalizeReceipt(body.paymentReceipt);

    if (!paymentReceipt) {
      return NextResponse.json(
        { message: "A valid image or PDF receipt is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSession = await MentorSession.findOneAndUpdate(
      {
        _id: id,
        studentId: session.user.id,
        status: "accepted",
      },
      {
        $set: {
          paymentReceipt,
          status: "payment_pending",
          paymentStatus: "unpaid",
        },
      },
      { new: true, runValidators: true }
    ).populate("mentorId", "name image email");

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Accepted session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment receipt submitted for verification.",
      session: mentorSession,
    });
  } catch (error) {
    console.error("Upload payment receipt error:", error);
    return NextResponse.json(
      { message: "Failed to upload payment receipt." },
      { status: 500 }
    );
  }
}


