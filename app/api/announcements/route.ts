import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Announcement from "@/models/Announcement";

export const dynamic = "force-dynamic";

function getAudiencesForRole(role: unknown) {
  const normalizedRole = String(role || "student").toLowerCase();

  if (normalizedRole === "mentor") {
    return ["all", "mentors"];
  }

  return ["all", "students"];
}

function serializeAnnouncement(announcement: any) {
  return {
    id: String(announcement._id),
    title: announcement.title || "",
    content: announcement.content || "",
    targetAudience: announcement.targetAudience || "all",
    expiresAt: announcement.expiresAt || null,
    createdAt: announcement.createdAt || null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const announcements = await Announcement.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      targetAudience: { $in: getAudiencesForRole(session.user.role) },
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      announcements: announcements.map(serializeAnnouncement),
    });
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcements." },
      { status: 500 }
    );
  }
}
