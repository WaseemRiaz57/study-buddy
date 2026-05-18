import { connectMongoDB } from "@/lib/mongodb";
import {
  PRICING_PLANS,
  normalizeSubscriptionPlan,
  type PricingPlanConfig,
  type SubscriptionPlanId,
} from "@/lib/pricingConfig";
import SubscriptionPlan from "@/models/SubscriptionPlan";

type PlanTier = "Free" | "Pro" | "Elite";

const tierById: Record<SubscriptionPlanId, PlanTier> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};

function idFromTier(tier: unknown): SubscriptionPlanId {
  return normalizeSubscriptionPlan(tier);
}

function displayPrice(price: number) {
  return price <= 0 ? "$0" : `$${Number(price).toFixed(price % 1 === 0 ? 0 : 2)}`;
}

export function serializeSubscriptionPlan(plan: any): PricingPlanConfig {
  const id = idFromTier(plan?.tier);
  const limits = plan?.limits || {};
  const price = Number(plan?.price ?? 0);

  return {
    id,
    name: tierById[id],
    price,
    displayPrice: displayPrice(price),
    description: String(plan?.description || ""),
    cta: String(plan?.cta || (id === "free" ? "Join Free" : id === "pro" ? "Upgrade to Pro" : "Go Elite")),
    featured: Boolean(plan?.featured),
    limits: {
      aiGenerationsPerDay:
        id === "elite" && limits.maxNotesPerDay == null
          ? null
          : Number(limits.maxNotesPerDay ?? 0),
      activeStudyRooms:
        id === "elite" && limits.maxStudyRooms == null
          ? null
          : Number(limits.maxStudyRooms ?? 0),
      studyRoomCapacity: Number(limits.studyRoomCapacity ?? 4),
      resourceUploadsPerMonth:
        id === "elite" && limits.resourceUploadsPerMonth == null
          ? null
          : Number(limits.resourceUploadsPerMonth ?? 0),
    },
    features: Array.isArray(plan?.features) ? plan.features.map(String) : [],
  };
}

function defaultPlanPayload(plan: PricingPlanConfig) {
  return {
    tier: tierById[plan.id],
    price: plan.price,
    description: plan.description,
    cta: plan.cta,
    featured: Boolean(plan.featured),
    features: plan.features,
    limits: {
      maxNotesPerDay: plan.limits.aiGenerationsPerDay,
      maxStudyRooms: plan.limits.activeStudyRooms,
      studyRoomCapacity: plan.limits.studyRoomCapacity,
      resourceUploadsPerMonth: plan.limits.resourceUploadsPerMonth,
    },
  };
}

export async function ensureSubscriptionPlans() {
  await connectMongoDB();

  await Promise.all(
    PRICING_PLANS.map((plan) =>
      SubscriptionPlan.updateOne(
        { tier: tierById[plan.id] },
        { $setOnInsert: defaultPlanPayload(plan) },
        { upsert: true }
      )
    )
  );
}

export async function getSubscriptionPlans() {
  await ensureSubscriptionPlans();

  const plans = await SubscriptionPlan.find({})
    .sort({ price: 1 })
    .lean();

  const byId = new Map(plans.map((plan) => [serializeSubscriptionPlan(plan).id, plan]));

  return PRICING_PLANS.map((fallbackPlan) =>
    serializeSubscriptionPlan(byId.get(fallbackPlan.id) || defaultPlanPayload(fallbackPlan))
  );
}

export async function getSubscriptionPlan(plan: unknown) {
  const id = normalizeSubscriptionPlan(plan);
  const plans = await getSubscriptionPlans();

  return plans.find((entry) => entry.id === id) || plans[0];
}

export async function updateSubscriptionPlan(tier: string, body: any) {
  await ensureSubscriptionPlans();

  const id = normalizeSubscriptionPlan(tier);
  const update: Record<string, unknown> = {};

  if (body.price !== undefined) update.price = Math.max(0, Number(body.price || 0));
  if (body.description !== undefined) update.description = String(body.description || "");
  if (body.cta !== undefined) update.cta = String(body.cta || "");
  if (body.featured !== undefined) update.featured = Boolean(body.featured);
  if (Array.isArray(body.features)) {
    update.features = body.features.map((feature: unknown) => String(feature).trim()).filter(Boolean);
  }

  if (body.limits && typeof body.limits === "object") {
    const limits: Record<string, number | null> = {};
    if ("maxNotesPerDay" in body.limits) {
      limits.maxNotesPerDay =
        body.limits.maxNotesPerDay === null ? null : Math.max(0, Number(body.limits.maxNotesPerDay || 0));
    }
    if ("maxStudyRooms" in body.limits) {
      limits.maxStudyRooms =
        body.limits.maxStudyRooms === null ? null : Math.max(0, Number(body.limits.maxStudyRooms || 0));
    }
    if ("studyRoomCapacity" in body.limits) {
      limits.studyRoomCapacity = Math.max(1, Number(body.limits.studyRoomCapacity || 1));
    }
    if ("resourceUploadsPerMonth" in body.limits) {
      limits.resourceUploadsPerMonth =
        body.limits.resourceUploadsPerMonth === null
          ? null
          : Math.max(0, Number(body.limits.resourceUploadsPerMonth || 0));
    }

    for (const [key, value] of Object.entries(limits)) {
      update[`limits.${key}`] = value;
    }
  }

  const plan = await SubscriptionPlan.findOneAndUpdate(
    { tier: tierById[id] },
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  return serializeSubscriptionPlan(plan);
}
