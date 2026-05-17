import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { connectMongoDB } from "@/lib/mongodb";
import { logActivity } from "@/lib/logActivity";
import Appeal from "@/models/Appeal";
import AutoModSetting from "@/models/AutoModSetting";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";
import ModerationLog, {
  type ModerationActionType,
} from "@/models/ModerationLog";
import Notification from "@/models/Notification";
import Resource from "@/models/Resource";
import User from "@/models/User";

type LeanUser = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  activeStrikes?: number;
};

export async function getAutoModSetting() {
  await connectMongoDB();

  const settings = await AutoModSetting.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { new: true, upsert: true }
  );

  return settings;
}

function buildExpiry(days: number) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + Math.max(1, days));
  return expiry;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: { user, pass },
  });
}

async function sendPenaltyMessage({
  user,
  actionType,
  reason,
  expiresAt,
}: {
  user: LeanUser;
  actionType: ModerationActionType;
  reason: string;
  expiresAt?: Date | null;
}) {
  const title =
    actionType === "ban"
      ? "Your account has been banned"
      : actionType === "strike"
        ? "A strike was added to your account"
        : "You received a moderation warning";

  const expiryText = expiresAt
    ? ` This penalty expires on ${expiresAt.toLocaleDateString()}.`
    : "";
  const message = `${title}. Reason: ${reason}.${expiryText}`;

  await Notification.create({
    userId: user._id,
    recipientId: user._id,
    senderId: null,
    type: "system",
    title,
    message,
    read: false,
    metadata: {
      actionType,
      reason,
      expiresAt: expiresAt?.toISOString() || null,
    },
  });

  const transporter = createTransporter();
  if (!transporter || !user.email) return;

  await transporter
    .sendMail({
      from: `"StudyBuddy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: title,
      text: message,
    })
    .catch(() => null);
}

export async function issuePenalty(
  userId: string,
  actionType: ModerationActionType,
  reason: string
) {
  await connectMongoDB();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  const settings = await getAutoModSetting();
  const normalizedReason = String(reason || "Moderation action").trim();
  const expiresAt =
    actionType === "warning" || actionType === "strike"
      ? buildExpiry(settings.strikeExpiryDays)
      : null;

  const log = await ModerationLog.create({
    userId,
    actionType,
    reason: normalizedReason,
    expiresAt,
    isActive: true,
  });

  const user = (await User.findByIdAndUpdate(
    userId,
    actionType === "strike"
      ? { $inc: { activeStrikes: 1 } }
      : actionType === "ban"
        ? { $set: { accountStatus: "banned", status: "suspended" } }
        : {},
    { new: true, select: "name email activeStrikes" }
  ).lean()) as LeanUser | null;

  if (!user) {
    throw new Error("User not found.");
  }

  if (
    actionType === "strike" &&
    Number(user.activeStrikes || 0) >= Number(settings.banAfterStrikes || 3)
  ) {
    await ModerationLog.create({
      userId,
      actionType: "ban",
      reason: `Automatic ban after ${user.activeStrikes} active strikes.`,
      expiresAt: null,
      isActive: true,
    });

    await User.findByIdAndUpdate(userId, {
      $set: { accountStatus: "banned", status: "suspended" },
    });

    await sendPenaltyMessage({
      user,
      actionType: "ban",
      reason: `Automatic ban after ${user.activeStrikes} active strikes.`,
      expiresAt: null,
    });
  }

  await sendPenaltyMessage({ user, actionType, reason: normalizedReason, expiresAt });

  await logActivity({
    actionType: `MODERATION_${actionType.toUpperCase()}`,
    message: `Admin issued ${actionType} to ${user.email || userId}`,
    targetId: userId,
  });

  return log;
}

export async function revokeModerationLog(logId: string) {
  await connectMongoDB();

  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new Error("Invalid moderation log ID.");
  }

  const log = await ModerationLog.findById(logId);
  if (!log) {
    throw new Error("Moderation log not found.");
  }

  if (!log.isActive) {
    return log;
  }

  log.isActive = false;
  await log.save();

  const update =
    log.actionType === "strike"
      ? { $inc: { activeStrikes: -1 } }
      : log.actionType === "ban"
        ? { $set: { accountStatus: "active", status: "active" } }
        : {};

  const user = (await User.findByIdAndUpdate(log.userId, update, {
    new: true,
    select: "name email activeStrikes",
  }).lean()) as LeanUser | null;

  if (user && Number(user.activeStrikes || 0) < 0) {
    await User.findByIdAndUpdate(log.userId, { $set: { activeStrikes: 0 } });
  }

  await logActivity({
    actionType: "MODERATION_REVOKED",
    message: `Admin revoked ${log.actionType} for ${user?.email || log.userId}`,
    targetId: String(log.userId),
  });

  return log;
}

export async function resolveReportedUserId(
  targetType: string,
  targetId: string
) {
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return null;
  }

  if (targetType === "user") {
    return targetId;
  }

  if (targetType === "post") {
    const post = await CommunityPost.findById(targetId, "authorId").lean();
    return post?.authorId ? String(post.authorId) : null;
  }

  if (targetType === "comment") {
    const comment = await Comment.findById(targetId, "authorId").lean();
    return comment?.authorId ? String(comment.authorId) : null;
  }

  if (targetType === "resource") {
    const resource = await Resource.findById(targetId, "uploadedBy").lean();
    return resource?.uploadedBy ? String(resource.uploadedBy) : null;
  }

  return null;
}

export async function approveAppeal(appealId: string) {
  await connectMongoDB();

  const appeal = await Appeal.findById(appealId);
  if (!appeal) {
    throw new Error("Appeal not found.");
  }

  appeal.status = "approved";
  await appeal.save();
  await revokeModerationLog(String(appeal.logId));

  await logActivity({
    actionType: "APPEAL_APPROVED",
    message: `Admin approved appeal ${appealId}`,
    targetId: String(appeal.userId),
  });

  return appeal;
}
