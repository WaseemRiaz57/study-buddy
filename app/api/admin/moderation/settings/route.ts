import { NextResponse } from "next/server";
import { getAutoModSetting } from "@/lib/moderationEngine";
import { logActivity } from "@/lib/logActivity";
import { requireAdmin } from "../_utils";

function normalizeKeywords(input: unknown) {
  if (Array.isArray(input)) {
    return input.map(String);
  }

  return String(input || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const settings = await getAutoModSetting();

  return NextResponse.json({
    settings: {
      banAfterStrikes: settings.banAfterStrikes,
      strikeExpiryDays: settings.strikeExpiryDays,
      restrictedKeywords: settings.restrictedKeywords,
      autoFlagAI: settings.autoFlagAI,
    },
  });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const settings = await getAutoModSetting();

  settings.banAfterStrikes = Math.min(
    10,
    Math.max(1, Number(body.banAfterStrikes || settings.banAfterStrikes || 3))
  );
  settings.strikeExpiryDays = Math.min(
    3650,
    Math.max(1, Number(body.strikeExpiryDays || settings.strikeExpiryDays || 30))
  );
  settings.restrictedKeywords = normalizeKeywords(body.restrictedKeywords);
  settings.autoFlagAI = Boolean(body.autoFlagAI);
  await settings.save();

  await logActivity({
    actionType: "AUTOMOD_SETTINGS_UPDATED",
    message: "Admin updated auto-moderation settings.",
  });

  return NextResponse.json({ message: "Settings saved.", settings });
}
