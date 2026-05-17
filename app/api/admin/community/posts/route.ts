import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const AUTHOR_SELECT = "name image profileImage role";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function normalizeStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "published") return "Published";
  if (normalized === "flagged") return "Flagged";
  return "";
}

function serializePost(post: any, commentCount: number) {
  const author = post.authorId || {};
  const authorName = author.name || "Unknown User";
  const likes = Array.isArray(post.likes) ? post.likes : [];

  return {
    id: String(post._id),
    title: post.title || "Untitled post",
    body: post.body || "",
    excerpt: String(post.body || "").replace(/\s+/g, " ").slice(0, 180),
    category: post.category || "General",
    tags: Array.isArray(post.tags) ? post.tags : [],
    likesCount: likes.length,
    commentCount,
    views: Number(post.views || 0),
    status: post.status || "Published",
    isPinned: Boolean(post.isPinned),
    createdAt: post.createdAt || null,
    author: {
      id: author._id ? String(author._id) : "",
      name: authorName,
      image: author.profileImage || author.image || "",
      initials: getInitials(authorName),
      role: author.role || "student",
    },
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim().slice(0, 120);
    const role = String(searchParams.get("role") || "").trim().toLowerCase();
    const status = normalizeStatus(String(searchParams.get("status") || ""));
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { body: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (role && role !== "all") {
      const authors = await User.find({ role })
        .select("_id")
        .lean();
      query.authorId = { $in: authors.map((author) => author._id) };
    }

    const posts = await CommunityPost.find(query)
      .populate("authorId", AUTHOR_SELECT)
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    const postIds = posts.map((post) => post._id);
    const commentCounts = postIds.length
      ? await Comment.aggregate([
          { $match: { postId: { $in: postIds } } },
          { $group: { _id: "$postId", count: { $sum: 1 } } },
        ])
      : [];
    const commentCountMap = new Map(
      commentCounts.map((item) => [String(item._id), Number(item.count || 0)])
    );

    return NextResponse.json({
      posts: posts.map((post) =>
        serializePost(post, commentCountMap.get(String(post._id)) || 0)
      ),
    });
  } catch (error) {
    console.error("Fetch admin community posts error:", error);
    return NextResponse.json(
      { message: "Failed to fetch community posts." },
      { status: 500 }
    );
  }
}
