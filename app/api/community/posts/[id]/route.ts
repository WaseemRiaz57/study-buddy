import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const AUTHOR_SELECT = "name image profileImage role lastActive";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SB"
  );
}

function serializeAuthor(author: any) {
  const name = author?.name || "Scholar";

  return {
    id: String(author?._id || ""),
    name,
    image: author?.profileImage || author?.image || "",
    initials: getInitials(name),
    role: author?.role || "student",
    lastActive: author?.lastActive || null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid post id." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "");

    await connectMongoDB();

    const [post, comments, currentUser] = await Promise.all([
      CommunityPost.findById(id).populate("authorId", AUTHOR_SELECT).lean(),
      Comment.countDocuments({ postId: id }),
      currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
        ? User.findById(currentUserId).select("savedPosts").lean()
        : null,
    ]);

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const likes = Array.isArray(post.likes) ? post.likes : [];
    const savedPostIds = Array.isArray((currentUser as any)?.savedPosts)
      ? (currentUser as any).savedPosts.map((userPostId: unknown) => String(userPostId))
      : [];

    return NextResponse.json({
      post: {
        id: String(post._id),
        title: post.title || "",
        body: post.body || "",
        tags: Array.isArray(post.tags) ? post.tags : [],
        category: post.category || "General",
        attachments: Array.isArray(post.attachments) ? post.attachments : [],
        author: serializeAuthor(post.authorId),
        likes: likes.length,
        likedByMe: Boolean(currentUserId && likes.some((userId: unknown) => String(userId) === currentUserId)),
        savedByMe: savedPostIds.includes(String(post._id)),
        comments,
        views: Number(post.views || 0),
        createdAt: post.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Fetch community post error:", error);
    return NextResponse.json(
      { message: "Failed to fetch community post." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const post = await CommunityPost.findById(id).select("authorId title");

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    if (String(post.authorId) !== session.user.id) {
      return NextResponse.json({ message: "Only the author can delete this post." }, { status: 403 });
    }

    await Promise.all([
      CommunityPost.findByIdAndDelete(id),
      Comment.deleteMany({ postId: id }),
      User.updateMany({ savedPosts: id }, { $pull: { savedPosts: id } }),
    ]);

    return NextResponse.json({ success: true, message: "Post deleted." });
  } catch (error) {
    console.error("Delete community post error:", error);
    return NextResponse.json(
      { message: "Failed to delete community post." },
      { status: 500 }
    );
  }
}


