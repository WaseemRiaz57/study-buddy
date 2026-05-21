import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { trackProgress } from "@/lib/challengeTracker";
import { awardUser } from "@/lib/gamificationEngine";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const AUTHOR_SELECT = "name image profileImage role lastActive";

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

async function serializePost(
  post: any,
  commentCount = 0,
  currentUserId = "",
  savedPostIds: string[] = []
) {
  const likes = Array.isArray(post.likes) ? post.likes : [];

  return {
    id: String(post._id),
    title: post.title || "",
    body: post.body || "",
    excerpt: String(post.body || "").replace(/\s+/g, " ").slice(0, 220),
    tags: Array.isArray(post.tags) ? post.tags : [],
    category: post.category || "General",
    attachments: Array.isArray(post.attachments) ? post.attachments : [],
    author: serializeAuthor(post.authorId),
    likes: likes.length,
    likedByMe: Boolean(currentUserId && likes.some((id: unknown) => String(id) === currentUserId)),
    savedByMe: savedPostIds.includes(String(post._id)),
    comments: commentCount,
    views: Number(post.views || 0),
    createdAt: post.createdAt || null,
    hot: likes.length + commentCount * 2 + Number(post.views || 0) / 25 >= 10,
  };
}

function normalizeTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((tag) => tag.trim());

  return [
    ...new Set(
      rawTags
        .map((tag) => String(tag || "").trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8)
    ),
  ];
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "");

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const category = String(searchParams.get("category") || "").trim();
    const sort = String(searchParams.get("sort") || "Recent").trim().toLowerCase();
    const search = String(searchParams.get("search") || "").trim().slice(0, 100);

    const query: Record<string, unknown> = {};

    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { body: { $regex: escapeRegex(search), $options: "i" } },
        { tags: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const posts = await CommunityPost.find(query)
      .populate("authorId", AUTHOR_SELECT)
      .sort(sort.includes("hot") || sort.includes("like") ? { views: -1, createdAt: -1 } : { createdAt: -1 })
      .lean();

    const postIds = posts.map((post) => post._id);
    const [counts, currentUser] = await Promise.all([
      postIds.length
        ? Comment.aggregate([
          { $match: { postId: { $in: postIds } } },
          { $group: { _id: "$postId", count: { $sum: 1 } } },
        ])
        : [],
      currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
        ? User.findById(currentUserId).select("savedPosts").lean()
        : null,
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    const savedPostIds = Array.isArray((currentUser as any)?.savedPosts)
      ? (currentUser as any).savedPosts.map((id: unknown) => String(id))
      : [];

    const serialized = await Promise.all(
      posts.map((post) =>
        serializePost(
          post,
          countMap.get(String(post._id)) || 0,
          currentUserId,
          savedPostIds
        )
      )
    );

    if (sort.includes("hot") || sort.includes("like")) {
      serialized.sort(
        (a, b) =>
          b.likes + b.comments * 2 + b.views / 25 -
          (a.likes + a.comments * 2 + a.views / 25)
      );
    }

    return NextResponse.json({ posts: serialized });
  } catch (error) {
    console.error("Fetch community posts error:", error);
    return NextResponse.json(
      { message: "Failed to fetch community posts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const postBody = String(body.body || "").trim();
    const category = String(body.category || "").trim();
    const tags = normalizeTags(body.tags);
    const attachments = Array.isArray(body.attachments)
      ? body.attachments.map((url: unknown) => String(url || "").trim()).filter(Boolean)
      : [];

    if (title.length < 3 || title.length > 180) {
      return NextResponse.json(
        { message: "Title must be between 3 and 180 characters." },
        { status: 400 }
      );
    }

    if (postBody.length < 10 || postBody.length > 12000) {
      return NextResponse.json(
        { message: "Body must be between 10 and 12000 characters." },
        { status: 400 }
      );
    }

    if (!category || category.length > 80) {
      return NextResponse.json(
        { message: "Category is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const post = await CommunityPost.create({
      authorId: session.user.id,
      title,
      body: postBody,
      category,
      tags,
      attachments,
    });

    const [rewardResult] = await Promise.allSettled([
      awardUser(session.user.id, "CREATED_POST"),
      trackProgress(session.user.id, "created_post", 1),
      logActivity({
        actionType: "COMMUNITY_POST_CREATED",
        message: `${session.user.name || "A user"} published a community post: ${title}`,
        targetId: String(post._id),
      }),
    ]);

    const populatedPost = await CommunityPost.findById(post._id)
      .populate("authorId", AUTHOR_SELECT)
      .lean();

    return NextResponse.json(
      {
        post: populatedPost ? await serializePost(populatedPost, 0, session.user.id) : null,
        reward: rewardResult.status === "fulfilled" ? rewardResult.value : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create community post error:", error);
    return NextResponse.json(
      { message: "Failed to publish community post." },
      { status: 500 }
    );
  }
}


