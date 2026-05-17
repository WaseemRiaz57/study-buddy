import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";
import User from "@/models/User";

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

    const [
      totalUsers,
      pendingMentors,
      revenueResult,
      activeSessions,
    ] = await Promise.all([
      User.countDocuments({}),
      MentorProfile.countDocuments({ status: "pending" }),
      MentorProfile.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalEarnings" },
          },
        },
      ]),
      MentorSession.countDocuments({ status: "accepted" }),
    ]);

    return NextResponse.json({
      totalUsers,
      pendingMentors,
      totalRevenue: Number(revenueResult?.[0]?.totalRevenue || 0),
      activeSessions,
    });
  } catch (error) {
    console.error("Fetch admin overview stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch admin overview stats." },
      { status: 500 }
    );
  }
}


