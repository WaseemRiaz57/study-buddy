import { NextResponse } from "next/server";
import { approveAppeal } from "@/lib/moderationEngine";
import { requireAdmin } from "../../../_utils";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await approveAppeal(id);
    return NextResponse.json({ message: "Appeal approved and penalty lifted." });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to approve appeal.",
      },
      { status: 400 }
    );
  }
}
