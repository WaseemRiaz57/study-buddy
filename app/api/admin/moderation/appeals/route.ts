import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Appeal from "@/models/Appeal";
import { requireAdmin } from "../_utils";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const query =
    status && ["pending", "approved", "rejected"].includes(status)
      ? { status }
      : {};

  const [appeals, pending, approved, rejected] = await Promise.all([
    Appeal.find(query)
      .populate("userId", "name email image role accountStatus activeStrikes")
      .populate("logId", "actionType reason expiresAt createdAt isActive")
      .sort({ createdAt: -1 })
      .lean(),
    Appeal.countDocuments({ status: "pending" }),
    Appeal.countDocuments({ status: "approved" }),
    Appeal.countDocuments({ status: "rejected" }),
  ]);

  return NextResponse.json({
    appeals: appeals.map((appeal) => ({
      id: appeal._id.toString(),
      message: appeal.message,
      status: appeal.status,
      createdAt: appeal.createdAt,
      user: appeal.userId,
      log: appeal.logId,
    })),
    stats: { pending, approved, rejected },
  });
}
