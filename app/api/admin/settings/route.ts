import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import PlatformSettings from "@/models/PlatformSettings";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function serializeSettings(settings: any) {
  return {
    id: String(settings._id),
    platformName: settings.platformName || "StudyBuddy",
    platformLogo: settings.platformLogo || "",
    supportEmail: settings.supportEmail || "support@studybuddy.io",
    allowNewSignups: Boolean(settings.allowNewSignups),
    maintenanceMode: Boolean(settings.maintenanceMode),
    updatedAt: settings.updatedAt || null,
  };
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

async function getOrCreateSettings() {
  let settings = await PlatformSettings.findOne({}).sort({ createdAt: 1 });

  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  return settings;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectMongoDB();
    const settings = await getOrCreateSettings();

    return NextResponse.json({ settings: serializeSettings(settings) });
  } catch (fetchError) {
    console.error("Fetch platform settings error:", fetchError);
    return NextResponse.json(
      { message: "Failed to fetch platform settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const update = {
      platformName: String(body.platformName || "StudyBuddy").trim().slice(0, 100),
      platformLogo: String(body.platformLogo || "").trim(),
      supportEmail: String(body.supportEmail || "support@studybuddy.io")
        .trim()
        .toLowerCase()
        .slice(0, 160),
      allowNewSignups: Boolean(body.allowNewSignups),
      maintenanceMode: Boolean(body.maintenanceMode),
    };

    await connectMongoDB();
    const settings = await getOrCreateSettings();

    settings.set(update);
    await settings.save();

    await logActivity({
      actionType: "PLATFORM_SETTINGS_UPDATED",
      message: "Admin updated platform settings",
      targetId: String(settings._id),
    });

    return NextResponse.json({
      success: true,
      message: "Platform settings updated.",
      settings: serializeSettings(settings),
    });
  } catch (updateError) {
    console.error("Update platform settings error:", updateError);
    return NextResponse.json(
      { message: "Failed to update platform settings." },
      { status: 500 }
    );
  }
}


