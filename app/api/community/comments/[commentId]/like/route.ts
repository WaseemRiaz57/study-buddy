import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ message: "Invalid comment id." }, { status: 400 });
    }

    await connectMongoDB();

    const comment = await Comment.findById(commentId).select("likes");

    if (!comment) {
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }

    const hasLiked = comment.likes.some(
      (userId) => String(userId) === session.user.id
    );

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      hasLiked
        ? { $pull: { likes: session.user.id } }
        : { $addToSet: { likes: session.user.id } },
      { new: true }
    ).select("likes");

    return NextResponse.json({
      liked: !hasLiked,
      likes: updatedComment?.likes.length || 0,
    });
  } catch (error) {
    console.error("Toggle community comment like error:", error);
    return NextResponse.json(
      { message: "Failed to update comment like." },
      { status: 500 }
    );
  }
}
