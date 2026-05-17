import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Report from "@/models/Report";

const ALLOWED_TARGET_TYPES = ["post", "comment", "user", "resource"];
const PRIORITY_BY_REASON: Record<string, "high" | "med" | "low"> = {
  harassment: "high",
  copyright: "high",
  spam: "med",
  "off-topic": "low",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetType = String(body.targetType || "").trim().toLowerCase();
  const targetId = String(body.targetId || "").trim();
  const reason = String(body.reason || "").trim();
  const contentSnippet = String(body.contentSnippet || "").trim();

  if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
    return NextResponse.json({ message: "Invalid report target." }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return NextResponse.json({ message: "Invalid target ID." }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ message: "Please choose a reason." }, { status: 400 });
  }

  await connectMongoDB();

  await Report.create({
    reporterId: session.user.id,
    targetType,
    targetId,
    reason,
    contentSnippet: contentSnippet.slice(0, 1000),
    priority: PRIORITY_BY_REASON[reason.toLowerCase()] || "low",
    status: "pending",
  });

  return NextResponse.json({ message: "Report submitted. Our team will review it." });
}
