import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import ModerationLog from "@/models/ModerationLog";
import { requireAdmin } from "../_utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectMongoDB();

  const [logs, activeWarnings, activeStrikes, activeBans] = await Promise.all([
    ModerationLog.find({ isActive: true })
      .populate("userId", "name email image role accountStatus activeStrikes")
      .sort({ createdAt: -1 })
      .lean(),
    ModerationLog.countDocuments({ isActive: true, actionType: "warning" }),
    ModerationLog.countDocuments({ isActive: true, actionType: "strike" }),
    ModerationLog.countDocuments({ isActive: true, actionType: "ban" }),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log._id.toString(),
      actionType: log.actionType,
      reason: log.reason,
      expiresAt: log.expiresAt || null,
      createdAt: log.createdAt,
      user: log.userId,
    })),
    stats: {
      activeWarnings,
      activeStrikes,
      activeBans,
    },
  });
}
