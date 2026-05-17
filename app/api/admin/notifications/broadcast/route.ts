import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import BroadcastLog from "@/models/BroadcastLog";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Audience = "all" | "free" | "pro";
type DeliveryMethod = "in-app" | "email";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeAudience(value: unknown): Audience | null {
  const audience = String(value || "").trim().toLowerCase();

  if (audience === "all" || audience === "free" || audience === "pro") {
    return audience;
  }

  return null;
}

function normalizeDeliveryMethods(value: unknown): DeliveryMethod[] {
  const rawMethods = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  const methods = new Set<DeliveryMethod>();

  for (const method of rawMethods) {
    const normalized = String(method || "").trim().toLowerCase();

    if (normalized === "email") {
      methods.add("email");
    }

    if (normalized === "in-app" || normalized === "inapp") {
      methods.add("in-app");
    }
  }

  if (methods.size === 0) {
    methods.add("in-app");
  }

  return Array.from(methods);
}

function buildUserQuery(audience: Audience) {
  if (audience === "all") {
    return {};
  }

  if (audience === "free") {
    const freeConditions: Record<string, unknown>[] = [];
    freeConditions.push({ plan: "Free" });
    freeConditions.push({ plan: { $exists: false } });
    freeConditions.push({ plan: "" });

    return { $or: freeConditions };
  }

  const paidPlanConditions: Record<string, unknown>[] = [];
  for (const paidPlan of new Set(["Pro", "Elite"])) {
    paidPlanConditions.push({ plan: paidPlan });
  }

  return { $or: paidPlanConditions };
}

function getAudienceLabel(audience: Audience) {
  if (audience === "all") return "All Users";
  if (audience === "free") return "Free";
  return "Pro";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(title: string, message: string) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; margin:0; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px 10px 32px; text-align:center;">
                    <div style="font-size:26px; font-weight:800; color:#7C3AED;">StudyBuddy</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 32px 32px;">
                    <h1 style="margin:0; font-size:22px; line-height:1.35; color:#111827; text-align:center;">${safeTitle}</h1>
                    <p style="margin:18px 0 0 0; font-size:15px; line-height:1.7; color:#374151; white-space:pre-line;">${safeMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim().slice(0, 140);
    const message = String(body.message || "").trim().slice(0, 800);
    const audience = normalizeAudience(body.audience);
    const deliveryMethods = normalizeDeliveryMethods(
      body.deliveryMethods || body.deliveryMethod
    );

    if (!title || !message || !audience) {
      return NextResponse.json(
        { message: "title, message, and audience ('all' | 'free' | 'pro') are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const userQuery = buildUserQuery(audience);
    const audienceLabel = getAudienceLabel(audience);

    const users = await User.find(userQuery).select("_id email").lean();
    const senderId = mongoose.Types.ObjectId.isValid(session.user.id)
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;

    if (users.length > 0) {
      await Notification.insertMany(
        users.map((user) => ({
          userId: user._id,
          recipientId: user._id,
          senderId,
          type: "system",
          title,
          message,
          audience: audienceLabel,
          read: false,
          isGlobal: false,
          metadata: {
            audience,
            broadcastTitle: title,
          },
        }))
      );
    }

    let emailSuccessCount = 0;
    let emailFailureCount = 0;

    if (deliveryMethods.includes("email")) {
      const emails = users
        .map((user: any) => String(user.email || "").trim().toLowerCase())
        .filter(isValidEmail);
      const transporter = buildTransporter();
      const from = `"StudyBuddy" <${process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@studybuddy.local"}>`;

      const results = await Promise.allSettled(
        emails.map((email) =>
          transporter.sendMail({
            from,
            to: email,
            subject: title,
            text: message,
            html: buildEmailHtml(title, message),
          })
        )
      );

      emailSuccessCount = results.filter((result) => result.status === "fulfilled").length;
      emailFailureCount = results.length - emailSuccessCount;
    }

    await BroadcastLog.create({
      title,
      message,
      deliveryMethods,
      audience: audienceLabel,
      targetCount: users.length,
      emailSuccessCount,
      emailFailureCount,
    });

    await logActivity({
      actionType: "GLOBAL_NOTIFICATION_SENT",
      message: `Admin sent a global notification: ${title}`,
    });

    return NextResponse.json({
      success: true,
      message: "Global notification sent.",
      sentCount: users.length,
      emailSuccessCount,
      emailFailureCount,
      deliveryMethods,
      audience,
    });
  } catch (error) {
    console.error("Broadcast notification error:", error);
    return NextResponse.json(
      { message: "Failed to send global notification." },
      { status: 500 }
    );
  }
}


