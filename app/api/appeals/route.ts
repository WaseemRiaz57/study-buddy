import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Appeal from "@/models/Appeal";
import ModerationLog from "@/models/ModerationLog";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const logId = String(body.logId || "").trim();
  const message = String(body.message || "").trim();

  if (message.length < 20) {
    return NextResponse.json(
      { message: "Please include at least 20 characters in your appeal." },
      { status: 400 }
    );
  }

  await connectMongoDB();

  let resolvedLogId: string | null = null;
  if (logId) {
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return NextResponse.json({ message: "Invalid penalty ID." }, { status: 400 });
    }

    const log = await ModerationLog.findOne({
      _id: logId,
      userId: session.user.id,
      isActive: true,
    }).lean();

    if (!log) {
      return NextResponse.json({ message: "Penalty not found." }, { status: 404 });
    }

    resolvedLogId = logId;
  }

  const existing = await Appeal.findOne({
    userId: session.user.id,
    logId: resolvedLogId ? new mongoose.Types.ObjectId(resolvedLogId) : null,
    status: "pending",
  }).lean();

  if (existing) {
    return NextResponse.json(
      { message: "You already have a pending appeal under review." },
      { status: 409 }
    );
  }

  await Appeal.create({
    userId: session.user.id,
    logId: resolvedLogId ? new mongoose.Types.ObjectId(resolvedLogId) : null,
    message,
    status: "pending",
  });

  return NextResponse.json({ message: "Your appeal is under review." });
}
