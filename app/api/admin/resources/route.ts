import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Resource from "@/models/Resource";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function parseSizeBytes(resource: any) {
  const rawSize = Number(resource.size || 0);

  if (Number.isFinite(rawSize) && rawSize > 0) {
    return rawSize;
  }

  const fileSize = String(resource.fileSize || "").trim();
  const match = fileSize.match(/([\d.]+)\s*(B|KB|MB|GB)/i);

  if (!match) return 0;

  const value = Number(match[1]);
  const unit = match[2].toUpperCase();

  if (!Number.isFinite(value)) return 0;
  if (unit === "GB") return Math.round(value * 1024 * 1024 * 1024);
  if (unit === "MB") return Math.round(value * 1024 * 1024);
  if (unit === "KB") return Math.round(value * 1024);
  return Math.round(value);
}

function formatStorage(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function serializeResource(resource: any) {
  const uploader = resource.uploadedBy || {};
  const status = resource.status || "pending";
  const sizeBytes = parseSizeBytes(resource);

  return {
    id: String(resource._id),
    title: resource.title || "Untitled resource",
    subject: resource.subject || "General",
    description: resource.description || "",
    tags: Array.isArray(resource.tags) ? resource.tags : [],
    fileUrl: resource.fileUrl || "",
    fileSize: resource.fileSize || formatStorage(sizeBytes),
    size: sizeBytes,
    fileType: resource.fileType || "FILE",
    pageCount: Number(resource.pageCount || 0),
    rating: Number(resource.rating || 0),
    downloadCount: Number(resource.downloadCount || 0),
    status,
    createdAt: resource.createdAt || null,
    uploader: {
      id: uploader._id ? String(uploader._id) : "",
      name: uploader.name || "Unknown User",
      email: uploader.email || "",
      role: uploader.role || "student",
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const resources = await Resource.find({})
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const serializedResources = resources.map(serializeResource);
    const pendingCount = serializedResources.filter(
      (resource) => resource.status === "pending"
    ).length;
    const verifiedCount = serializedResources.filter(
      (resource) => resource.status === "approved"
    ).length;
    const storageBytes = serializedResources.reduce(
      (total, resource) => total + resource.size,
      0
    );

    return NextResponse.json({
      stats: {
        pendingCount,
        verifiedCount,
        storageBytes,
        storageUsed: formatStorage(storageBytes),
      },
      resources: serializedResources,
    });
  } catch (error) {
    console.error("Fetch admin resources error:", error);
    return NextResponse.json(
      { message: "Failed to fetch resources." },
      { status: 500 }
    );
  }
}


