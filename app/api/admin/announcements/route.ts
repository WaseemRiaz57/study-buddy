import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Announcement, {
  type AnnouncementAudience,
} from "@/models/Announcement";

export const dynamic = "force-dynamic";

const AUDIENCES: AnnouncementAudience[] = ["all", "students", "mentors"];

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

function normalizeAudience(value: unknown): AnnouncementAudience {
  const normalized = String(value || "").trim().toLowerCase();
  return AUDIENCES.includes(normalized as AnnouncementAudience)
    ? (normalized as AnnouncementAudience)
    : "all";
}

function serializeAnnouncement(announcement: any) {
  return {
    id: String(announcement._id),
    title: announcement.title || "",
    content: announcement.content || "",
    targetAudience: announcement.targetAudience || "all",
    expiresAt: announcement.expiresAt || null,
    isActive: Boolean(announcement.isActive),
    createdAt: announcement.createdAt || null,
    updatedAt: announcement.updatedAt || null,
  };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectMongoDB();

    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      announcements: announcements.map(serializeAnnouncement),
    });
  } catch (error) {
    console.error("Fetch admin announcements error:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcements." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const targetAudience = normalizeAudience(body.targetAudience);
    const expiresAt = new Date(String(body.expiresAt || ""));

    if (title.length < 3 || title.length > 140) {
      return NextResponse.json(
        { message: "Title must be between 3 and 140 characters." },
        { status: 400 }
      );
    }

    if (content.length < 5 || content.length > 1200) {
      return NextResponse.json(
        { message: "Content must be between 5 and 1200 characters." },
        { status: 400 }
      );
    }

    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return NextResponse.json(
        { message: "Expiry date must be a valid future date." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const announcement = await Announcement.create({
      title,
      content,
      targetAudience,
      expiresAt,
      isActive: true,
    });

    await logActivity({
      actionType: "ANNOUNCEMENT_CREATED",
      message: `Admin created a new announcement: ${announcement.title}`,
      targetId: String(announcement._id),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement created successfully.",
        announcement: serializeAnnouncement(announcement),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { message: "Failed to create announcement." },
      { status: 500 }
    );
  }
}


