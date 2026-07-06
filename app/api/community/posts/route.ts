import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
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
export const runtime = "nodejs";

const AUTHOR_SELECT = "name image profileImage role lastActive";
const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 6;
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
]);
const IMAGE_ATTACHMENT_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CreatePostRequestData = {
  title: string;
  body: string;
  category: string;
  tags: string[];
  attachmentUrls: string[];
  attachmentFiles: File[];
};

class AttachmentUploadError extends Error {}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function serializeAuthor(author: unknown) {
  const authorRecord = asRecord(author);
  const name = String(authorRecord.name || "Scholar");

  return {
    id: String(authorRecord._id || ""),
    name,
    image: String(authorRecord.profileImage || authorRecord.image || ""),
    initials: getInitials(name),
    role: String(authorRecord.role || "student"),
    lastActive: authorRecord.lastActive || null,
  };
}

async function serializePost(
  post: unknown,
  commentCount = 0,
  currentUserId = "",
  savedPostIds: string[] = []
) {
  const postRecord = asRecord(post);
  const likes = Array.isArray(postRecord.likes) ? postRecord.likes : [];

  return {
    id: String(postRecord._id),
    title: String(postRecord.title || ""),
    body: String(postRecord.body || ""),
    excerpt: String(postRecord.body || "").replace(/\s+/g, " ").slice(0, 220),
    tags: Array.isArray(postRecord.tags) ? postRecord.tags : [],
    category: String(postRecord.category || "General"),
    attachments: Array.isArray(postRecord.attachments) ? postRecord.attachments : [],
    author: serializeAuthor(postRecord.authorId),
    likes: likes.length,
    likedByMe: Boolean(currentUserId && likes.some((id: unknown) => String(id) === currentUserId)),
    savedByMe: savedPostIds.includes(String(postRecord._id)),
    comments: commentCount,
    views: Number(postRecord.views || 0),
    createdAt: postRecord.createdAt || null,
    hot: likes.length + commentCount * 2 + Number(postRecord.views || 0) / 25 >= 10,
  };
}

function normalizeTags(value: unknown) {
  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      parsedValue = value;
    }
  }

  const rawTags = Array.isArray(parsedValue)
    ? parsedValue
    : String(parsedValue || "")
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

function getSavedPostIds(currentUser: unknown) {
  const savedPosts = asRecord(currentUser).savedPosts;

  return Array.isArray(savedPosts)
    ? savedPosts.map((id: unknown) => String(id))
    : [];
}

function getLowerCaseExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const extension = getLowerCaseExtension(fileName);
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "community-attachment"}${extension}`;
}

function uploadCommunityAttachment(fileBuffer: Buffer, fileName: string) {
  const extension = getLowerCaseExtension(fileName);
  const resourceType = IMAGE_ATTACHMENT_EXTENSIONS.has(extension) ? "image" : "raw";

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "study-buddy/community",
        resource_type: resourceType,
        public_id: `${Date.now()}-${sanitizeFileName(fileName)}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

async function uploadCommunityAttachments(files: File[]) {
  if (files.length === 0) return [];

  if (files.length > MAX_ATTACHMENTS) {
    throw new AttachmentUploadError(`Attach up to ${MAX_ATTACHMENTS} files per post.`);
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const attachmentUrls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new AttachmentUploadError(`${file.name} exceeds the 20MB upload limit.`);
    }

    const extension = getLowerCaseExtension(file.name);

    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
      throw new AttachmentUploadError(
        `${file.name} is not supported. Upload a PDF, image, or document file.`
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadCommunityAttachment(fileBuffer, file.name);

    if (result.secure_url) {
      attachmentUrls.push(result.secure_url);
    }
  }

  return attachmentUrls;
}

async function parseCreatePostRequest(request: Request): Promise<CreatePostRequestData> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    const formData = await request.formData();
    const files = formData
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);

    return {
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      tags: normalizeTags(formData.get("tags")),
      attachmentUrls: [],
      attachmentFiles: files,
    };
  }

  const body = await request.json().catch(() => ({}));

  return {
    title: String(body.title || "").trim(),
    body: String(body.body || "").trim(),
    category: String(body.category || "").trim(),
    tags: normalizeTags(body.tags),
    attachmentUrls: Array.isArray(body.attachments)
      ? body.attachments.map((url: unknown) => String(url || "").trim()).filter(Boolean)
      : [],
    attachmentFiles: [],
  };
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
    const savedPostIds = getSavedPostIds(currentUser);

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

    const {
      title,
      body: postBody,
      category,
      tags,
      attachmentUrls,
      attachmentFiles,
    } = await parseCreatePostRequest(request);

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

    const uploadedAttachmentUrls = await uploadCommunityAttachments(attachmentFiles);
    const attachments = [...attachmentUrls, ...uploadedAttachmentUrls];

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
    if (error instanceof AttachmentUploadError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Create community post error:", error);
    return NextResponse.json(
      { message: "Failed to publish community post." },
      { status: 500 }
    );
  }
}


