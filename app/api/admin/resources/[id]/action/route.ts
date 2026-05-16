import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Resource from "@/models/Resource";

export const dynamic = "force-dynamic";

type ResourceAction = "approve" | "reject";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeAction(action: unknown): ResourceAction | null {
  const normalized = String(action || "").trim().toLowerCase();

  if (normalized === "approve" || normalized === "reject") {
    return normalized;
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Valid resource id is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = normalizeAction(body.action);

    if (!action) {
      return NextResponse.json(
        { message: "action must be either 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    ).populate("uploadedBy", "name email role");

    if (!resource) {
      return NextResponse.json(
        { message: "Resource not found." },
        { status: 404 }
      );
    }

    const uploader = (resource as any).uploadedBy || {};
    const uploaderName = uploader.name || "Unknown User";

    await logActivity({
      actionType:
        action === "approve" ? "RESOURCE_APPROVED" : "RESOURCE_REJECTED",
      message:
        action === "approve"
          ? `Admin approved resource: ${resource.title} uploaded by ${uploaderName}`
          : `Admin rejected resource: ${resource.title} uploaded by ${uploaderName}`,
      targetId: String(resource._id),
    });

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Resource approved successfully."
          : "Resource rejected successfully.",
      resource: {
        id: String(resource._id),
        title: resource.title,
        status: resource.status,
      },
    });
  } catch (error) {
    console.error("Moderate resource error:", error);
    return NextResponse.json(
      { message: "Failed to update resource." },
      { status: 500 }
    );
  }
}
