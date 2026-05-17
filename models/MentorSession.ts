import mongoose, { Schema, Document } from "mongoose";

export type MentorSessionStatus =
  | "pending"
  | "accepted"
  | "payment_pending"
  | "payment_verified"
  | "declined"
  | "rejected"
  | "completed";

export type MentorSessionPaymentStatus = "unpaid" | "paid";
export type MentorSessionType = "scheduled" | "instant";

export interface IMentorSessionAttachment {
  url: string;
  name: string;
}

export interface IMentorSession extends Document {
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  subject: string;
  scheduledAt: Date;
  duration: number;
  type: MentorSessionType;
  status: MentorSessionStatus;
  paymentStatus: MentorSessionPaymentStatus;
  paymentReceipt: string;
  roomId: string;
  goals: string[];
  attachments: IMentorSessionAttachment[];
  privateNotes: string;
}

const MentorSessionAttachmentSchema = new Schema<IMentorSessionAttachment>(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MentorSessionSchema = new Schema<IMentorSession>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    type: {
      type: String,
      enum: ["scheduled", "instant"],
      default: "scheduled",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "payment_pending",
        "payment_verified",
        "declined",
        "rejected",
        "completed",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentReceipt: { type: String, default: "" },
    roomId: { type: String, default: "", trim: true },
    goals: { type: [String], default: [] },
    attachments: { type: [MentorSessionAttachmentSchema], default: [] },
    privateNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

MentorSessionSchema.index({ studentId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ mentorId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ mentorId: 1, status: 1, scheduledAt: 1 });
MentorSessionSchema.index({ status: 1, paymentStatus: 1 });
MentorSessionSchema.index({ type: 1, status: 1 });

export default mongoose.models.MentorSession ||
  mongoose.model<IMentorSession>("MentorSession", MentorSessionSchema);
