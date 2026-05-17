import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Badge, { type BadgeRarity } from "@/models/Badge";
import UserBadge from "@/models/UserBadge";

export const dynamic = "force-dynamic";

const RARITIES: BadgeRarity[] = ["common", "rare", "legendary"];

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

function normalizeRarity(value: unknown): BadgeRarity {
  const normalized = String(value || "").trim().toLowerCase();
  return RARITIES.includes(normalized as BadgeRarity)
    ? (normalized as BadgeRarity)
    : "common";
}

function normalizeMetric(value: unknown) {
  return String(value || "").trim().toLowerCase().slice(0, 80);
}

function sanitizeBadgeInput(body: any) {
  const update: Record<string, unknown> = {};

  if ("title" in body) update.title = String(body.title || "").trim().slice(0, 120);
  if ("description" in body) {
    update.description = String(body.description || "").trim().slice(0, 500);
  }
  if ("icon" in body) update.icon = String(body.icon || "Award").trim().slice(0, 80);
  if ("rarity" in body) update.rarity = normalizeRarity(body.rarity);
  if ("metricLabel" in body) update.metricLabel = normalizeMetric(body.metricLabel);
  if ("targetValue" in body) {
    update.targetValue = Math.max(1, Math.round(Number(body.targetValue || 1)));
  }
  if ("xpBonus" in body) {
    update.xpBonus = Math.max(0, Math.round(Number(body.xpBonus || 0)));
  }
  if ("coinBonus" in body) {
    update.coinBonus = Math.max(0, Math.round(Number(body.coinBonus || 0)));
  }
  if ("isActive" in body) update.isActive = Boolean(body.isActive);

  return update;
}

function serializeBadge(badge: any, earnedCount = 0) {
  return {
    id: String(badge._id),
    title: badge.title || "",
    description: badge.description || "",
    icon: badge.icon || "Award",
    rarity: badge.rarity || "common",
    metricLabel: badge.metricLabel || "",
    targetValue: Number(badge.targetValue || 0),
    xpBonus: Number(badge.xpBonus || 0),
    coinBonus: Number(badge.coinBonus || 0),
    isActive: Boolean(badge.isActive),
    earnedCount,
    createdAt: badge.createdAt || null,
    updatedAt: badge.updatedAt || null,
  };
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
        { message: "Valid badge id is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const update = sanitizeBadgeInput(body);

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No badge fields were provided." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const badge = await Badge.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!badge) {
      return NextResponse.json({ message: "Badge not found." }, { status: 404 });
    }

    const earnedCount = await UserBadge.countDocuments({ badgeId: badge._id });

    await logActivity({
      actionType: "BADGE_UPDATED",
      message: `Admin updated badge: ${badge.title}`,
      targetId: String(badge._id),
    });

    return NextResponse.json({
      success: true,
      message: "Badge updated.",
      badge: serializeBadge(badge, earnedCount),
    });
  } catch (error) {
    console.error("Update badge error:", error);
    return NextResponse.json(
      { message: "Failed to update badge." },
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
        { message: "Valid badge id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const badge = await Badge.findByIdAndDelete(id);

    if (!badge) {
      return NextResponse.json({ message: "Badge not found." }, { status: 404 });
    }

    await UserBadge.deleteMany({ badgeId: badge._id });

    await logActivity({
      actionType: "BADGE_DELETED",
      message: `Admin deleted badge: ${badge.title}`,
      targetId: String(badge._id),
    });

    return NextResponse.json({
      success: true,
      message: "Badge deleted.",
    });
  } catch (error) {
    console.error("Delete badge error:", error);
    return NextResponse.json(
      { message: "Failed to delete badge." },
      { status: 500 }
    );
  }
}
