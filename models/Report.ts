import mongoose, { Document, Model, Schema } from "mongoose";

export type ReportTargetType = "post" | "comment" | "user" | "resource";
export type ReportPriority = "high" | "med" | "low";
export type ReportStatus = "pending" | "resolved";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  reason: string;
  contentSnippet: string;
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "resource"],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    contentSnippet: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: ["high", "med", "low"],
      default: "low",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, priority: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1, status: 1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
