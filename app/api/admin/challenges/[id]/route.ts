import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge, { type ChallengeType } from "@/models/Challenge";
import UserChallengeProgress from "@/models/UserChallengeProgress";

export const dynamic = "force-dynamic";

const CHALLENGE_TYPES: ChallengeType[] = ["daily", "weekly", "global", "elite"];

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

function normalizeType(value: unknown): ChallengeType | null {
  const normalized = String(value || "").trim().toLowerCase();
  return CHALLENGE_TYPES.includes(normalized as ChallengeType)
    ? (normalized as ChallengeType)
    : null;
}

function buildUpdatePayload(body: any) {
  const update: Record<string, unknown> = {};

  if (typeof body.isActive === "boolean") {
    update.isActive = body.isActive;
  }

  if (body.title !== undefined) {
    update.title = String(body.title || "").trim();
  }

  if (body.description !== undefined) {
    update.description = String(body.description || "").trim();
  }

  if (body.type !== undefined) {
    const type = normalizeType(body.type);
    if (type) update.type = type;
  }

  if (body.targetMetric !== undefined) {
    update.targetMetric = Math.max(
      1,
      Math.floor(Number(body.targetMetric || 1))
    );
  }

  if (body.metricLabel !== undefined) {
    update.metricLabel =
      String(body.metricLabel || "items").trim().slice(0, 40) || "items";
  }

  if (body.xpReward !== undefined) {
    update.xpReward = Math.max(0, Math.floor(Number(body.xpReward || 0)));
  }

  if (body.coinsReward !== undefined) {
    update.coinsReward = Math.max(0, Math.floor(Number(body.coinsReward || 0)));
  }

  return update;
}

function validateUpdatePayload(update: Record<string, unknown>) {
  if (
    update.title !== undefined &&
    (String(update.title).length < 3 || String(update.title).length > 140)
  ) {
    return "Title must be between 3 and 140 characters.";
  }

  if (
    update.description !== undefined &&
    (String(update.description).length < 5 ||
      String(update.description).length > 500)
  ) {
    return "Description must be between 5 and 500 characters.";
  }

  return "";
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
        { message: "Valid challenge id is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const update = buildUpdatePayload(body);
    const validationError = validateUpdatePayload(update);

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No challenge fields were provided." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found." },
        { status: 404 }
      );
    }

    const toggledOnly =
      Object.keys(update).length === 1 && update.isActive !== undefined;

    await logActivity({
      actionType: toggledOnly ? "CHALLENGE_TOGGLED" : "CHALLENGE_UPDATED",
      message: toggledOnly
        ? `Admin ${challenge.isActive ? "activated" : "deactivated"} challenge: ${challenge.title}`
        : `Admin updated challenge: ${challenge.title}`,
      targetId: String(challenge._id),
    });

    return NextResponse.json({
      success: true,
      message: toggledOnly
        ? `Challenge ${challenge.isActive ? "activated" : "deactivated"}.`
        : "Challenge updated successfully.",
      challenge: {
        id: String(challenge._id),
        title: challenge.title,
        isActive: challenge.isActive,
      },
    });
  } catch (error) {
    console.error("Update admin challenge error:", error);
    return NextResponse.json(
      { message: "Failed to update challenge." },
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
        { message: "Valid challenge id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const challenge = await Challenge.findByIdAndDelete(id);

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found." },
        { status: 404 }
      );
    }

    await UserChallengeProgress.deleteMany({ challengeId: challenge._id });

    await logActivity({
      actionType: "CHALLENGE_DELETED",
      message: `Admin deleted challenge: ${challenge.title}`,
      targetId: String(challenge._id),
    });

    return NextResponse.json({
      success: true,
      message: "Challenge deleted successfully.",
    });
  } catch (error) {
    console.error("Delete admin challenge error:", error);
    return NextResponse.json(
      { message: "Failed to delete challenge." },
      { status: 500 }
    );
  }
}


