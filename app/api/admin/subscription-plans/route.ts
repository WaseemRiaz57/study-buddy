import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from "@/lib/subscriptionPlans";

export const dynamic = "force-dynamic";

function isAdmin(role: unknown) {
  return String(role || "").toLowerCase() === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const plans = await getSubscriptionPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Fetch admin subscription plans error:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscription plans." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const tier = String(body?.tier || "");
    const plan = await updateSubscriptionPlan(tier, body);

    await logActivity({
      actionType: "SUBSCRIPTION_PLAN_UPDATED",
      message: `Admin updated the ${plan.name} subscription plan`,
      targetId: plan.id,
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Update subscription plan error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update subscription plan.",
      },
      { status: 500 }
    );
  }
}
