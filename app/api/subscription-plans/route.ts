import { NextResponse } from "next/server";
import { getSubscriptionPlans } from "@/lib/subscriptionPlans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await getSubscriptionPlans();

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Fetch subscription plans error:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscription plans." },
      { status: 500 }
    );
  }
}
