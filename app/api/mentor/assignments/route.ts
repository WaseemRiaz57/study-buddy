import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import MentorSession from "@/models/MentorSession";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

function parseDueDate(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (String(session.user.role || "").toLowerCase() !== "mentor") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId || "");
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const dueDate = parseDueDate(body.dueDate);

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return NextResponse.json(
        { message: "Valid mentor and student ids are required." },
        { status: 400 }
      );
    }

    if (!title || title.length > 160) {
      return NextResponse.json(
        { message: "Task title must be between 1 and 160 characters." },
        { status: 400 }
      );
    }

    if (description.length > 1200) {
      return NextResponse.json(
        { message: "Description cannot exceed 1200 characters." },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { message: "A valid due date is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connectedSession = await MentorSession.findOne({
      mentorId: session.user.id,
      studentId,
      status: { $in: ["accepted", "completed", "payment_verified"] },
    }).select("_id");

    if (!connectedSession) {
      return NextResponse.json(
        { message: "You can only assign tasks to connected students." },
        { status: 403 }
      );
    }

    const assignment = await Assignment.create({
      mentorId: session.user.id,
      studentId,
      title,
      description,
      dueDate,
      status: "pending",
    });

    await Notification.create({
      userId: studentId,
      recipientId: studentId,
      senderId: mongoose.Types.ObjectId.isValid(session.user.id)
        ? new mongoose.Types.ObjectId(session.user.id)
        : null,
      type: "system",
      title: "New Mentor Assignment",
      message: `Your mentor assigned a new task: ${title}`,
      read: false,
      metadata: {
        assignmentId: String(assignment._id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Assignment created successfully.",
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create mentor assignment error:", error);
    return NextResponse.json(
      { message: "Failed to create assignment." },
      { status: 500 }
    );
  }
}
