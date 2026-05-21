import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid post id." }, { status: 400 });
    }

    await connectMongoDB();

    const [post, user] = await Promise.all([
      CommunityPost.findById(id).select("_id").lean(),
      User.findById(session.user.id).select("savedPosts"),
    ]);

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const savedPosts = Array.isArray(user.savedPosts) ? user.savedPosts : [];
    const alreadySaved = savedPosts.some((postId: unknown) => String(postId) === id);

    await User.findByIdAndUpdate(session.user.id, {
      [alreadySaved ? "$pull" : "$addToSet"]: { savedPosts: id },
    });

    return NextResponse.json({
      success: true,
      saved: !alreadySaved,
      message: alreadySaved ? "Post removed from saved items." : "Post saved.",
    });
  } catch (error) {
    console.error("Save community post error:", error);
    return NextResponse.json({ message: "Failed to update saved post." }, { status: 500 });
  }
}
