import { NextResponse } from "next/server";
import { revokeModerationLog } from "@/lib/moderationEngine";
import { requireAdmin } from "../../../_utils";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await revokeModerationLog(id);
    return NextResponse.json({ message: "Penalty revoked successfully." });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to revoke penalty.",
      },
      { status: 400 }
    );
  }
}
