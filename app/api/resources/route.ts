import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { connectMongoDB } from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  getLowerCaseExtension,
  isAllowedUploadType,
} from "@/lib/study-room-constants";
import Resource from "@/models/Resource";
import { awardUser } from "@/lib/gamificationEngine";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCloudinaryResourceType(fileName: string): "raw" | "image" {
  const extension = getLowerCaseExtension(fileName);
  const rawFileExtensions = new Set([".pdf", ".docx", ".xlsx"]);

  return rawFileExtensions.has(extension) ? "raw" : "image";
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizePublicIdFileName(fileName: string): string {
  const extension = getLowerCaseExtension(fileName);
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "resource"}${extension}`;
}

function normalizePrice(value: FormDataEntryValue | null) {
  const price = Number(value ?? 0);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return Math.floor(price);
}

function userHasAccess(resource: any, userId: string) {
  const price = Number(resource.price || 0);

  if (price === 0) return true;

  return Array.isArray(resource.allowedUsers)
    ? resource.allowedUsers.some((allowedUserId: unknown) => {
        if (!allowedUserId) return false;
        return String(allowedUserId) === userId;
      })
    : false;
}

function serializeResource(resource: any, userId: string) {
  const isUnlocked = userHasAccess(resource, userId);
  const price = Math.max(0, Number(resource.price || 0));
  const ratings = Array.isArray(resource.ratings) ? resource.ratings : [];
  const averageRating = Number(resource.averageRating ?? resource.rating ?? 0);

  return {
    ...resource,
    price,
    rating: averageRating,
    averageRating,
    ratingCount: ratings.length,
    isUnlocked,
    fileUrl: isUnlocked ? resource.fileUrl : "",
    allowedUsers: undefined,
    ratings: undefined,
  };
}

function uploadToCloudinary(buffer: Buffer, fileName: string, folder = "study-buddy/resources") {
  return new Promise<{
    secure_url: string;
    bytes: number;
    resource_type: string;
    format?: string;
    pages?: number;
  }>((resolve, reject) => {
    const resourceType = getCloudinaryResourceType(fileName);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${sanitizePublicIdFileName(fileName)}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result as {
          secure_url: string;
          bytes: number;
          resource_type: string;
          format?: string;
          pages?: number;
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();
    const price = normalizePrice(formData.get("price"));
    const uploadedFile = formData.get("file");

    if (!title || !subject || !description || !(uploadedFile instanceof File)) {
      return NextResponse.json(
        { message: "title, subject, description and file are required." },
        { status: 400 }
      );
    }

    if (price === null) {
      return NextResponse.json(
        { message: "Price must be a valid non-negative coin amount." },
        { status: 400 }
      );
    }

    if (uploadedFile.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          message: "File exceeds 20MB limit.",
          maxSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
        },
        { status: 400 }
      );
    }

    if (!isAllowedUploadType(uploadedFile.name, uploadedFile.type || "")) {
      return NextResponse.json(
        {
          message: `Unsupported file type. Allowed types: ${ALLOWED_UPLOAD_EXTENSIONS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const cloudinaryResult = await uploadToCloudinary(fileBuffer, uploadedFile.name);

    const extension = getLowerCaseExtension(uploadedFile.name);
    const normalizedType = extension
      ? extension.replace(".", "").toUpperCase()
      : uploadedFile.type || (cloudinaryResult.format ?? "UNKNOWN").toUpperCase();

    await connectMongoDB();

    const resource = await Resource.create({
      title,
      subject,
      description,
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      fileUrl: cloudinaryResult.secure_url,
      fileSize: `${(cloudinaryResult.bytes / (1024 * 1024)).toFixed(2)} MB`,
      size: cloudinaryResult.bytes,
      fileType: normalizedType,
      pageCount: cloudinaryResult.pages ?? 0,
      uploadedBy: session.user.id,
      allowedUsers: [session.user.id],
      price,
      status: "pending",
    });
    const reward = await awardUser(session.user.id, "RESOURCE_UPLOAD");

    return NextResponse.json(
      {
        resource,
        reward,
        stats: reward.profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resource upload error:", error);
    return NextResponse.json({ message: "Failed to upload resource" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim().slice(0, 100);
    const subject = String(searchParams.get("subject") || "").trim().slice(0, 100);

    const query: Record<string, unknown> = {
      status: "approved",
    };

    if (subject) {
      query.subject = subject;
    }

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { subject: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const resources = await Resource.find(query)
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      resources.map((resource) => serializeResource(resource, session.user.id))
    );
  } catch (error) {
    console.error("Fetch resources error:", error);
    return NextResponse.json({ message: "Failed to fetch resources" }, { status: 500 });
  }
}


