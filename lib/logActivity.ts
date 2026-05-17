import { connectMongoDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";

interface LogActivityInput {
  actionType: string;
  message: string;
  targetId?: string;
}

export async function logActivity({
  actionType,
  message,
  targetId = "",
}: LogActivityInput) {
  const normalizedActionType = String(actionType || "").trim().slice(0, 80);
  const normalizedMessage = String(message || "").trim().slice(0, 300);
  const normalizedTargetId = String(targetId || "").trim();

  if (!normalizedActionType || !normalizedMessage) {
    return null;
  }

  await connectMongoDB();

  return AuditLog.create({
    actionType: normalizedActionType,
    message: normalizedMessage,
    targetId: normalizedTargetId,
  });
}

