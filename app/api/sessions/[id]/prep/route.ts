import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

const MAX_GOALS = 20;
const MAX_GOAL_LENGTH = 300;
const MAX_PRIVATE_NOTES_LENGTH = 5000;
const MAX_ATTACHMENTS = 20;

function normalizeGoals(goals: unknown): string[] | null {
  if (!Array.isArray(goals) || goals.length > MAX_GOALS) {
    return null;
  }

  return goals
    .map((goal) => String(goal ?? "").trim().slice(0, MAX_GOAL_LENGTH))
    .filter(Boolean);
}

function normalizeAttachments(attachments: unknown) {
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) {
    return null;
  }

  const normalizedAttachments = attachments
    .map((attachment) => {
      const item = attachment as { url?: unknown; name?: unknown };
      return {
        url: String(item?.url ?? "").trim(),
        name: String(item?.name ?? "").trim().slice(0, 200),
      };
    })
    .filter((attachment) => attachment.url && attachment.name);

  return normalizedAttachments.length === attachments.length
    ? normalizedAttachments
    : null;
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

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and user ids are required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const hasGoals = Object.prototype.hasOwnProperty.call(body, "goals");
    const hasPrivateNotes = Object.prototype.hasOwnProperty.call(
      body,
      "privateNotes"
    );
    const hasAttachments = Object.prototype.hasOwnProperty.call(
      body,
      "attachments"
    );

    const goals = hasGoals ? normalizeGoals(body.goals) : null;
    const attachments = hasAttachments
      ? normalizeAttachments(body.attachments)
      : null;

    if (hasGoals && !goals) {
      return NextResponse.json(
        { message: "goals must be an array of strings." },
        { status: 400 }
      );
    }

    if (hasAttachments && !attachments) {
      return NextResponse.json(
        { message: "attachments must be an array of { url, name } objects." },
        { status: 400 }
      );
    }

    const privateNotes = hasPrivateNotes
      ? String(body.privateNotes ?? "").trim().slice(0, MAX_PRIVATE_NOTES_LENGTH)
      : null;

    await connectMongoDB();

    const mentorSession = await MentorSession.findById(id);

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Session not found." },
        { status: 404 }
      );
    }

    const currentUserId = session.user.id;
    const isStudent = String(mentorSession.studentId) === currentUserId;
    const isMentor = String(mentorSession.mentorId) === currentUserId;

    if (!isStudent && !isMentor) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (hasPrivateNotes && !isMentor) {
      return NextResponse.json(
        { message: "Only the mentor can update private notes." },
        { status: 403 }
      );
    }

    if (hasGoals) {
      mentorSession.goals = goals;
    }

    if (hasPrivateNotes) {
      mentorSession.privateNotes = privateNotes;
    }

    if (hasAttachments) {
      mentorSession.attachments = attachments;
    }

    await mentorSession.save();

    return NextResponse.json(mentorSession);
  } catch (error) {
    console.error("Update session prep error:", error);
    return NextResponse.json(
      { message: "Failed to update session prep" },
      { status: 500 }
    );
  }
}
