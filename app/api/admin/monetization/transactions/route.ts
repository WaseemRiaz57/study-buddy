import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function serializeTransaction(transaction: any) {
  const user = transaction.userId || {};

  return {
    id: String(transaction._id),
    user: {
      id: user._id ? String(user._id) : "",
      name: user.name || "Unknown User",
      email: user.email || "No email",
      image: user.profileImage || user.image || "",
    },
    plan: transaction.plan || "Free",
    amount: Number(transaction.amount || 0),
    status: transaction.status || "Success",
    createdAt: transaction.createdAt,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const transactions = await Transaction.find({})
      .populate("userId", "name email image profileImage")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      transactions: transactions.map(serializeTransaction),
    });
  } catch (error) {
    console.error("Fetch monetization transactions error:", error);
    return NextResponse.json(
      { message: "Failed to fetch monetization transactions." },
      { status: 500 }
    );
  }
}
