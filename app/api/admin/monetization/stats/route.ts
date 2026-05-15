import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const PRO_PRICE = 9.99;
const ELITE_PRICE = 24.99;

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

    const [freeCount, proCount, eliteCount] = await Promise.all([
      User.countDocuments({ $or: [{ plan: "Free" }, { plan: { $exists: false } }] }),
      User.countDocuments({ plan: "Pro" }),
      User.countDocuments({ plan: "Elite" }),
    ]);

    const monthlyRecurringRevenue = proCount * PRO_PRICE + eliteCount * ELITE_PRICE;

    return NextResponse.json({
      freeCount,
      proCount,
      eliteCount,
      activePaidSubscriptions: proCount + eliteCount,
      monthlyRecurringRevenue,
      prices: {
        pro: PRO_PRICE,
        elite: ELITE_PRICE,
      },
    });
  } catch (error) {
    console.error("Fetch monetization stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch monetization stats." },
      { status: 500 }
    );
  }
}
