import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { logActivity } from "@/lib/logActivity";
import Appeal from "@/models/Appeal";
import { requireAdmin } from "../../../_utils";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectMongoDB();

  const { id } = await params;
  const appeal = await Appeal.findByIdAndUpdate(
    id,
    { $set: { status: "rejected" } },
    { new: true }
  );

  if (!appeal) {
    return NextResponse.json({ message: "Appeal not found." }, { status: 404 });
  }

  await logActivity({
    actionType: "APPEAL_REJECTED",
    message: `Admin rejected appeal ${id}`,
    targetId: String(appeal.userId),
  });

  return NextResponse.json({ message: "Appeal rejected." });
}
