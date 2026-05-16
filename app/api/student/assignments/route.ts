import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Assignment from "@/models/Assignment";

export const dynamic = "force-dynamic";

function serializeAssignment(assignment: any) {
  const mentor = assignment.mentorId || {};

  return {
    id: String(assignment._id),
    title: assignment.title || "Untitled assignment",
    description: assignment.description || "",
    dueDate: assignment.dueDate || null,
    status: assignment.status || "pending",
    createdAt: assignment.createdAt || null,
    mentor: {
      id: mentor._id ? String(mentor._id) : "",
      name: mentor.name || "Mentor",
      image: mentor.image || "",
      email: mentor.email || "",
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const assignments = await Assignment.find({
      studentId: session.user.id,
      status: "pending",
    })
      .populate("mentorId", "name image email")
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      assignments: assignments.map(serializeAssignment),
    });
  } catch (error) {
    console.error("Fetch student assignments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch assignments." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "");
    const status = String(body.status || "").trim().toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(id) || status !== "completed") {
      return NextResponse.json(
        { message: "Valid assignment id and completed status are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: id,
        studentId: session.user.id,
      },
      { $set: { status: "completed" } },
      { new: true }
    );

    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: serializeAssignment(assignment),
    });
  } catch (error) {
    console.error("Update student assignment error:", error);
    return NextResponse.json(
      { message: "Failed to update assignment." },
      { status: 500 }
    );
  }
}
