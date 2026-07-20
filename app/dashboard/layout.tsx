import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { DashboardClientShell } from "@/components/DashboardClientShell";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import { normalizeSubscriptionPlan } from "@/lib/pricingConfig";
import MentorProfile from "@/models/MentorProfile";
import { type Plan } from "@/store/useUserStore";
import { normalizeSessionRole } from "@/lib/roles";

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

  const initialRole = normalizeSessionRole(session.user.role);
  const initialPlan = normalizePlan(session.user.subscriptionPlan);
  let mentorAccessStatus: "approved" | "pending" | "not_submitted" = "approved";

  if (initialRole === "MENTOR") {
    await connectMongoDB();

    const mentorProfile = await MentorProfile.findOne({
      userId: session.user.id,
    })
      .select("status")
      .lean();
    const status = String(mentorProfile?.status || "").toLowerCase();

    if (!mentorProfile || !status || status === "unsubmitted") {
      mentorAccessStatus = "not_submitted";
    } else if (status === "approved") {
      mentorAccessStatus = "approved";
    } else if (status === "pending") {
      mentorAccessStatus = "pending";
    } else {
      mentorAccessStatus = "not_submitted";
    }
  }

  return (
    <DashboardClientShell
      initialRole={initialRole}
      initialPlan={initialPlan}
      mentorAccessStatus={mentorAccessStatus}
    >
      {children}
    </DashboardClientShell>
  );
}

