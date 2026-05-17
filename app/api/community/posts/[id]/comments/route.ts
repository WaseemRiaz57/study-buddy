import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { awardUser } from "@/lib/gamificationEngine";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";

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

function serializeComment(comment: any, currentUserId = "") {
  const likes = Array.isArray(comment.likes) ? comment.likes : [];

  return {
    id: String(comment._id),
    postId: String(comment.postId),
    text: comment.text || "",
    author: serializeAuthor(comment.authorId),
    likes: likes.length,
    likedByMe: Boolean(currentUserId && likes.some((userId: unknown) => String(userId) === currentUserId)),
    replies: Array.isArray(comment.replies) ? comment.replies : [],
    createdAt: comment.createdAt || null,
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

    const comments = await Comment.find({ postId: id })
      .populate("authorId", AUTHOR_SELECT)
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      comments: comments.map((comment) => serializeComment(comment, currentUserId)),
    });
  } catch (error) {
    console.error("Fetch community comments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch comments." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const text = String(body.text || "").trim();

    if (text.length < 1 || text.length > 4000) {
      return NextResponse.json(
        { message: "Comment must be between 1 and 4000 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const post = await CommunityPost.findById(id).select("title");

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const comment = await Comment.create({
      postId: id,
      authorId: session.user.id,
      text,
    });

    const [rewardResult] = await Promise.allSettled([
      awardUser(session.user.id, "CREATED_COMMENT"),
      logActivity({
        actionType: "COMMUNITY_COMMENT_CREATED",
        message: `${session.user.name || "A user"} commented on community post: ${post.title}`,
        targetId: String(post._id),
      }),
    ]);

    const populatedComment = await Comment.findById(comment._id)
      .populate("authorId", AUTHOR_SELECT)
      .lean();

    return NextResponse.json(
      {
        comment: serializeComment(populatedComment || comment, session.user.id),
        reward: rewardResult.status === "fulfilled" ? rewardResult.value : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create community comment error:", error);
    return NextResponse.json(
      { message: "Failed to add comment." },
      { status: 500 }
    );
  }
}


