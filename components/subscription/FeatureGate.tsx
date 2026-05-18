"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";

type Tier = "Free" | "Pro" | "Elite" | "free" | "pro" | "elite";

const tierRank: Record<string, number> = {
  free: 0,
  pro: 1,
  elite: 2,
};

function normalizeTier(tier: unknown) {
  const normalized = String(tier || "free").toLowerCase();
  if (normalized === "elite") return "elite";
  if (normalized === "pro") return "pro";
  return "free";
}

export function FeatureGate({
  requiredTier,
  children,
  fallback,
}: {
  requiredTier: Tier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const userTier = normalizeTier(session?.user?.subscriptionPlan);
  const required = normalizeTier(requiredTier);
  const allowed = tierRank[userTier] >= tierRank[required];

  if (status === "loading") {
    return (
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
    );
  }

  if (allowed) return <>{children}</>;

  return (
    <>
      {fallback || (
        <section className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
            <Lock size={18} />
          </div>
          <h2 className="text-base font-bold text-foreground">
            {required.toUpperCase()} feature
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade your plan to unlock this workspace.
          </p>
          <Link
            href="/dashboard/settings/subscription"
            prefetch={true}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-700"
          >
            Upgrade to Pro
          </Link>
        </section>
      )}
    </>
  );
}
