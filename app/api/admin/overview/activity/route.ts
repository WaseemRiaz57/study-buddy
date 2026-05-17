import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const activity = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json(
      activity.map((entry) => ({
        id: String(entry._id),
        actionType: entry.actionType || "",
        message: entry.message || "",
        targetId: entry.targetId || "",
        createdAt: entry.createdAt || null,
      }))
    );
  } catch (error) {
    console.error("Fetch admin overview activity error:", error);
    return NextResponse.json(
      { message: "Failed to fetch admin activity." },
      { status: 500 }
    );
  }
}


