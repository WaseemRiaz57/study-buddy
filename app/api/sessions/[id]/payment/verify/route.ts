import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();
    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. Only teachers can verify payments." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and mentor ids are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSession = await MentorSession.findOneAndUpdate(
      {
        _id: id,
        mentorId: session.user.id,
        status: "payment_pending",
        paymentReceipt: { $ne: "" },
      },
      {
        $set: {
          status: "payment_verified",
          paymentStatus: "paid",
          roomId: id,
        },
      },
      { new: true, runValidators: true }
    ).populate("studentId", "name image email");

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Payment receipt pending verification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      session: mentorSession,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { message: "Failed to verify payment." },
      { status: 500 }
    );
  }
}


