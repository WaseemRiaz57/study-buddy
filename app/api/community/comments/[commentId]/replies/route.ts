import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";

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

function serializeReply(reply: any, currentUserId = "") {
  const likes = Array.isArray(reply.likes) ? reply.likes : [];

  return {
    id: String(reply._id),
    text: reply.text || "",
    author: serializeAuthor(reply.authorId),
    likes: likes.length,
    likedByMe: Boolean(
      currentUserId && likes.some((userId: unknown) => String(userId) === currentUserId)
    ),
    createdAt: reply.createdAt || null,
  };
}

export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const text = String(body.text || "").trim();

    if (text.length < 1 || text.length > 4000) {
      return NextResponse.json(
        { message: "Reply must be between 1 and 4000 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const replyId = new mongoose.Types.ObjectId();
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            _id: replyId,
            authorId: session.user.id,
            text,
            likes: [],
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("replies.authorId", AUTHOR_SELECT)
      .lean();

    if (!updatedComment) {
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }

    const reply = (updatedComment.replies || []).find(
      (item: any) => String(item._id) === String(replyId)
    );

    return NextResponse.json(
      { reply: serializeReply(reply, session.user.id) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create community comment reply error:", error);
    return NextResponse.json(
      { message: "Failed to add reply." },
      { status: 500 }
    );
  }
}
