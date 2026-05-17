import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DashboardClientShell } from "@/components/DashboardClientShell";
import { authOptions } from "@/lib/authOptions";
import { normalizeSubscriptionPlan } from "@/lib/pricingConfig";
import { type Plan, type Role } from "@/store/useUserStore";

function normalizeRole(role: unknown): Role {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "teacher" || normalized === "mentor") return "TEACHER";
  return "STUDENT";
}

function normalizePlan(plan: unknown): Plan {
  const normalized = normalizeSubscriptionPlan(plan);
  if (normalized === "elite") return "ELITE";
  if (normalized === "pro") return "PRO";
  return "FREE";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <DashboardClientShell
      initialRole={normalizeRole(session.user.role)}
      initialPlan={normalizePlan(session.user.subscriptionPlan)}
    >
      {children}
    </DashboardClientShell>
  );
}

