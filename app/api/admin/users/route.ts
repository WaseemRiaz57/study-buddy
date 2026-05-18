import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeUser(user: any) {
  const normalizedStatus = String(user.status || user.accountStatus || "active").toLowerCase();

  return {
    id: String(user._id),
    name: user.name || "Unnamed User",
    email: user.email || "",
    image: user.image || user.profileImage || "",
    role: user.role || "student",
    isVerified: Boolean(user.isVerified || false),
    subscriptionPlan:
      String(user.subscriptionPlan || user.plan || "free").toLowerCase() === "elite"
        ? "elite"
        : String(user.subscriptionPlan || user.plan || "free").toLowerCase() === "pro"
          ? "pro"
          : "free",
    status:
      normalizedStatus === "suspended" || normalizedStatus === "banned"
        ? "suspended"
        : "active",
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    lastActive: user.lastActive || null,
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim();
    const plan = String(searchParams.get("plan") || "all").toLowerCase();
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: "i" } },
            { email: { $regex: escapeRegex(search), $options: "i" } },
          ],
        }
      : {};
    const planQuery =
      plan === "free"
        ? {
            $or: [
              { subscriptionPlan: "free" },
              { plan: "Free" },
              { plan: "free" },
              { subscriptionPlan: { $exists: false } },
              { subscriptionPlan: null },
              { subscriptionPlan: "" },
            ],
          }
        : plan === "pro" || plan === "elite"
        ? {
            $or: [
              { subscriptionPlan: plan },
              { plan: plan.charAt(0).toUpperCase() + plan.slice(1) },
              { plan },
            ],
          }
        : {};
    const queryParts = [searchQuery, planQuery].filter(
      (query) => Object.keys(query).length > 0
    );
    const userQuery = queryParts.length > 0 ? { $and: queryParts } : {};

    await connectMongoDB();

    const activeTodayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      activeToday,
      suspendedUsers,
      freeUsers,
      proUsers,
      eliteUsers,
      users,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gt: activeTodayCutoff } }),
      User.countDocuments({
        $or: [
          { status: "suspended" },
          { accountStatus: "suspended" },
          { accountStatus: "banned" },
        ],
      }),
      User.countDocuments({
        $or: [
          { subscriptionPlan: "free" },
          { plan: "Free" },
          { plan: "free" },
          { subscriptionPlan: { $exists: false } },
          { subscriptionPlan: null },
          { subscriptionPlan: "" },
        ],
      }),
      User.countDocuments({
        $or: [{ subscriptionPlan: "pro" }, { plan: "Pro" }, { plan: "pro" }],
      }),
      User.countDocuments({
        $or: [{ subscriptionPlan: "elite" }, { plan: "Elite" }, { plan: "elite" }],
      }),
      User.find(userQuery)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeToday,
        suspendedUsers,
        freeUsers,
        proUsers,
        eliteUsers,
      },
      users: users.map(serializeUser),
    });
  } catch (error) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json(
      { message: "Failed to fetch users." },
      { status: 500 }
    );
  }
}


