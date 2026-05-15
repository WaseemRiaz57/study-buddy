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
  return {
    id: String(user._id),
    name: user.name || "Unnamed User",
    email: user.email || "",
    image: user.image || "",
    role: user.role || "student",
    status: user.status || "active",
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
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: "i" } },
            { email: { $regex: escapeRegex(search), $options: "i" } },
          ],
        }
      : {};

    await connectMongoDB();

    const activeTodayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalUsers, activeToday, suspendedUsers, users] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gt: activeTodayCutoff } }),
      User.countDocuments({ status: "suspended" }),
      User.find(searchQuery)
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
