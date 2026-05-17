import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

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

    const post = await CommunityPost.findById(id).select("likes");

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const hasLiked = post.likes.some((userId) => String(userId) === session.user.id);

    const updatedPost = await CommunityPost.findByIdAndUpdate(
      id,
      hasLiked
        ? { $pull: { likes: session.user.id } }
        : { $addToSet: { likes: session.user.id } },
      { new: true }
    ).select("likes");

    return NextResponse.json({
      liked: !hasLiked,
      likes: updatedPost?.likes.length || 0,
    });
  } catch (error) {
    console.error("Toggle community post like error:", error);
    return NextResponse.json(
      { message: "Failed to update post like." },
      { status: 500 }
    );
  }
}


