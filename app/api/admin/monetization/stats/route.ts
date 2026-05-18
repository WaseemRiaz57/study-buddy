import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import { getSubscriptionPlans } from "@/lib/subscriptionPlans";
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

    const [freeCount, proCount, eliteCount, plans] = await Promise.all([
      User.countDocuments({
        $or: [
          { subscriptionPlan: "free" },
          { plan: "Free" },
          { plan: "free" },
          { subscriptionPlan: { $exists: false } },
        ],
      }),
      User.countDocuments({ $or: [{ subscriptionPlan: "pro" }, { plan: "Pro" }, { plan: "pro" }] }),
      User.countDocuments({ $or: [{ subscriptionPlan: "elite" }, { plan: "Elite" }, { plan: "elite" }] }),
      getSubscriptionPlans(),
    ]);
    const proPrice = plans.find((plan) => plan.id === "pro")?.price || 0;
    const elitePrice = plans.find((plan) => plan.id === "elite")?.price || 0;

    const monthlyRecurringRevenue = proCount * proPrice + eliteCount * elitePrice;

    return NextResponse.json({
      freeCount,
      proCount,
      eliteCount,
      activePaidSubscriptions: proCount + eliteCount,
      monthlyRecurringRevenue,
      prices: {
        pro: proPrice,
        elite: elitePrice,
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


