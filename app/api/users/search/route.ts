import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { CHAT_USER_SELECT, serializeChatUser } from "@/lib/chat";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "").trim();

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    await connectMongoDB();

    const users = await User.find({
      _id: { $ne: session.user.id },
      name: { $regex: escapeRegex(query), $options: "i" },
    })
      .select(CHAT_USER_SELECT)
      .sort({ name: 1 })
      .limit(8)
      .lean();

    return NextResponse.json({
      users: users.map(serializeChatUser),
    });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { message: "Failed to search users." },
      { status: 500 }
    );
  }
}
