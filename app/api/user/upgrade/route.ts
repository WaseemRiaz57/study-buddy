import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !["FREE", "PRO", "ELITE"].includes(plan.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Update the user's plan in the DB
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { plan: plan.toUpperCase() } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updatedUser.plan,
    });
  } catch (error: any) {
    console.error("Error in user upgrade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
