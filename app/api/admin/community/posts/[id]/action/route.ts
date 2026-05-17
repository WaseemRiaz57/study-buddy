import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid post id is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "").trim();

    if (action !== "toggle-pin") {
      return NextResponse.json(
        { message: "Unsupported moderation action." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const post = await CommunityPost.findById(id).populate(
      "authorId",
      "name"
    );

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    const authorName = (post.authorId as any)?.name || "Unknown User";
    const actionLabel = post.isPinned ? "pinned" : "unpinned";

    await logActivity({
      actionType: post.isPinned
        ? "COMMUNITY_POST_PINNED"
        : "COMMUNITY_POST_UNPINNED",
      message: `Admin ${actionLabel} a community post by ${authorName}`,
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: `Post ${actionLabel}.`,
      isPinned: post.isPinned,
    });
  } catch (error) {
    console.error("Community post action error:", error);
    return NextResponse.json(
      { message: "Failed to update community post." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid post id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const post = await CommunityPost.findById(id).populate(
      "authorId",
      "name"
    );

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const authorName = (post.authorId as any)?.name || "Unknown User";

    await Promise.all([
      Comment.deleteMany({ postId: post._id }),
      CommunityPost.deleteOne({ _id: post._id }),
    ]);

    await logActivity({
      actionType: "COMMUNITY_POST_DELETED",
      message: `Admin deleted a community post by ${authorName}`,
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Community post deleted.",
    });
  } catch (error) {
    console.error("Community post delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete community post." },
      { status: 500 }
    );
  }
}


