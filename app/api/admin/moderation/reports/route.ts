import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import {
  issuePenalty,
  resolveReportedUserId,
} from "@/lib/moderationEngine";
import { logActivity } from "@/lib/logActivity";
import Report, { type ReportPriority } from "@/models/Report";
import { requireAdmin } from "../_utils";

const PRIORITY_WEIGHT: Record<ReportPriority, number> = {
  high: 3,
  med: 2,
  low: 1,
};

function normalizeAction(action: unknown) {
  const normalized = String(action || "dismiss").trim().toLowerCase();
  if (normalized === "warn") return "warning";
  if (normalized === "strike") return "strike";
  if (normalized === "ban") return "ban";
  return "dismiss";
}

function serializeReporter(reporter: unknown) {
  const value = reporter as { name?: string; email?: string } | null;
  return {
    name: value?.name || "Unknown reporter",
    email: value?.email || "",
  };
}

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") === "resolved" ? "resolved" : "pending";
  const targetType = searchParams.get("targetType") || "";

  const query: Record<string, unknown> = { status };
  if (["post", "comment", "user", "resource"].includes(targetType)) {
    query.targetType = targetType;
  }

  const reports = await Report.find(query)
    .populate("reporterId", "name email image role")
    .sort({ priority: 1, createdAt: -1 })
    .lean();

  const groups = new Map<string, typeof reports>();
  for (const report of reports) {
    const key = `${report.targetType}:${report.targetId.toString()}`;
    groups.set(key, [...(groups.get(key) || []), report]);
  }

  const groupedReports = Array.from(groups.values())
    .map((items) => {
      const sorted = [...items].sort(
        (a, b) =>
          PRIORITY_WEIGHT[b.priority as ReportPriority] -
            PRIORITY_WEIGHT[a.priority as ReportPriority] ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const primary = sorted[0];

      return {
        id: primary._id.toString(),
        reportIds: sorted.map((report) => report._id.toString()),
        targetType: primary.targetType,
        targetId: primary.targetId.toString(),
        priority: primary.priority,
        count: sorted.length,
        others: Math.max(0, sorted.length - 1),
        reason: primary.reason,
        contentSnippet: primary.contentSnippet,
        status: primary.status,
        reporter: serializeReporter(primary.reporterId),
        createdAt: primary.createdAt,
      };
    })
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[b.priority as ReportPriority] -
          PRIORITY_WEIGHT[a.priority as ReportPriority] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const [pendingCount, highPriorityPending, resolvedCount] = await Promise.all([
    Report.countDocuments({ status: "pending" }),
    Report.countDocuments({ status: "pending", priority: "high" }),
    Report.countDocuments({ status: "resolved" }),
  ]);

  return NextResponse.json({
    reports: groupedReports,
    stats: {
      pendingCount,
      highPriorityPending,
      resolvedCount,
    },
  });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const reportIds = Array.isArray(body.reportIds)
    ? body.reportIds.map(String)
    : body.reportId
      ? [String(body.reportId)]
      : [];
  const action = normalizeAction(body.action);
  const reason = String(body.reason || "Report resolved by admin.").trim();

  await connectMongoDB();

  const reports = await Report.find({ _id: { $in: reportIds } });
  if (reports.length === 0) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  const primary = reports[0];
  const targetUserId = await resolveReportedUserId(
    primary.targetType,
    primary.targetId.toString()
  );

  if (["warning", "strike", "ban"].includes(action)) {
    if (!targetUserId) {
      return NextResponse.json(
        { message: "Could not identify the reported user." },
        { status: 400 }
      );
    }

    await issuePenalty(targetUserId, action as "warning" | "strike" | "ban", reason);
  }

  await Report.updateMany(
    { _id: { $in: reportIds } },
    { $set: { status: "resolved" } }
  );

  await logActivity({
    actionType: "REPORT_RESOLVED",
    message: `Admin resolved ${reports.length} report(s) with action ${action}.`,
    targetId: primary.targetId.toString(),
  });

  return NextResponse.json({ message: "Report resolved successfully." });
}
