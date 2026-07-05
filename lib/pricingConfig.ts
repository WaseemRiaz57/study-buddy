export type SubscriptionPlanId = "free" | "pro" | "elite";

export interface PricingPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  displayPrice: string;
  description: string;
  cta: string;
  featured?: boolean;
  limits: {
    aiGenerationsPerDay: number | null;
    activeStudyRooms: number | null;
    studyRoomCapacity: number;
    resourceUploadsPerMonth: number | null;
  };
  features: string[];
}

export const FREE_TIER_LIMITS = {
  aiGenerationsPerDay: 25,
  activeStudyRooms: 10,
  studyRoomCapacity: 4,
  resourceUploadsPerMonth: 15,
} as const;

export const PRICING_PLANS: PricingPlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    displayPrice: "$0",
    description: "Core study tools for getting started.",
    cta: "Join Free",
    limits: {
      aiGenerationsPerDay: FREE_TIER_LIMITS.aiGenerationsPerDay,
      activeStudyRooms: FREE_TIER_LIMITS.activeStudyRooms,
      studyRoomCapacity: FREE_TIER_LIMITS.studyRoomCapacity,
      resourceUploadsPerMonth: FREE_TIER_LIMITS.resourceUploadsPerMonth,
    },
    features: [
      "25 AI note generations per day",
      "10 active study rooms",
      "Study rooms up to 4 participants",
      "Community forum access",
      "Focus room and Pomodoro tools",
      "15 resource marketplace uploads per month",
      "Resource Hub downloads",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    displayPrice: "$9.99",
    description: "More AI, larger rooms, and stronger study workflows.",
    cta: "Upgrade to Pro",
    featured: true,
    limits: {
      aiGenerationsPerDay: 50,
      activeStudyRooms: 5,
      studyRoomCapacity: 12,
      resourceUploadsPerMonth: 25,
    },
    features: [
      "50 AI note generations per day",
      "5 active study rooms",
      "Study rooms up to 12 participants",
      "Priority matchmaking",
      "Advanced challenges",
      "Ad-free dashboard experience",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 24,
    displayPrice: "$24",
    description: "Full platform access for power learners and mentors.",
    cta: "Go Elite",
    limits: {
      aiGenerationsPerDay: null,
      activeStudyRooms: null,
      studyRoomCapacity: 20,
      resourceUploadsPerMonth: null,
    },
    features: [
      "Unlimited AI note generation",
      "Unlimited active study rooms",
      "Study rooms up to 20 participants",
      "Elite challenges",
      "Unlimited resource marketplace uploads",
      "Priority support and premium profile badge",
    ],
  },
];

export const pricingPlans = PRICING_PLANS;

export const PRICING_BY_ID = PRICING_PLANS.reduce(
  (plans, plan) => {
    plans[plan.id] = plan;
    return plans;
  },
  {} as Record<SubscriptionPlanId, PricingPlanConfig>
);

export function normalizeSubscriptionPlan(plan: unknown): SubscriptionPlanId {
  const normalized = String(plan || "").trim().toLowerCase();
  if (normalized === "elite") return "elite";
  if (normalized === "pro") return "pro";
  return "free";
}

export function getPricingPlan(plan: unknown): PricingPlanConfig {
  return PRICING_BY_ID[normalizeSubscriptionPlan(plan)];
}

// ─── Billing Cycle ──────────────────────────────────────────────────────────────

export const YEARLY_DISCOUNT_PERCENT = 20;

export type BillingCycle = "monthly" | "yearly";

/**
 * Applies the yearly discount to a monthly price.
 * This is the **single source of truth** for yearly pricing math.
 *
 * @example calculateYearlyPrice(9.99)  → 7.99
 * @example calculateYearlyPrice(24)    → 19.20
 * @example calculateYearlyPrice(0)     → 0
 */
export function calculateYearlyPrice(monthlyPrice: number): number {
  if (monthlyPrice <= 0) return 0;
  const discountMultiplier = 1 - YEARLY_DISCOUNT_PERCENT / 100;
  return Math.round(monthlyPrice * discountMultiplier * 100) / 100;
}

/**
 * Formats a numeric price for display.
 *
 * @example formatPlanPrice(9.99)  → "$9.99"
 * @example formatPlanPrice(0)     → "Free"
 */
export function formatPlanPrice(price: number): string {
  if (price <= 0) return "Free";
  return `$${price.toFixed(2)}`;
}

/**
 * Returns the total annual cost when paying yearly.
 *
 * @example getYearlyTotal(9.99)  → 95.88
 */
export function getYearlyTotal(monthlyPrice: number): number {
  return Math.round(calculateYearlyPrice(monthlyPrice) * 12 * 100) / 100;
}
