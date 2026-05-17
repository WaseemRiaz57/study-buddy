import { getPricingPlan, normalizeSubscriptionPlan } from "@/lib/pricingConfig";
import User from "@/models/User";

export async function getUserSubscriptionPlan(userId: string) {
  const user = await User.findById(userId)
    .select("subscriptionPlan plan")
    .lean();

  const subscriptionPlan = normalizeSubscriptionPlan(
    (user as any)?.subscriptionPlan || (user as any)?.plan
  );

  return getPricingPlan(subscriptionPlan);
}

export function upgradeRequiredResponse(message: string) {
  return {
    message,
    upgradeRequired: true,
  };
}

export function todayUsageWindow() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

