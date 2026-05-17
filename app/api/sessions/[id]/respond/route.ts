import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

type RespondAction = "accept" | "reject";

function normalizeAction(action: unknown): RespondAction | null {
  const normalizedAction = String(action ?? "").trim().toLowerCase();

  if (normalizedAction === "accept" || normalizedAction === "reject") {
    return normalizedAction;
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

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. This feature is only available to teachers." },
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

    const { action } = await request.json();
    const normalizedAction = normalizeAction(action);

    if (!normalizedAction) {
      return NextResponse.json(
        { message: "action must be either 'accept' or 'reject'." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const update =
      normalizedAction === "accept"
        ? { status: "accepted", roomId: randomUUID() }
        : { status: "rejected" };

    const updatedSession = await MentorSession.findOneAndUpdate(
      {
        _id: id,
        mentorId: session.user.id,
        status: "pending",
      },
      { $set: update },
      { new: true, runValidators: true }
    ).populate("studentId", "name image email");

    if (!updatedSession) {
      return NextResponse.json(
        { message: "Pending session request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Respond to mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to respond to mentor session" },
      { status: 500 }
    );
  }
}


