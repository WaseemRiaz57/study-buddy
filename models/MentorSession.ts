import mongoose, { Schema, Document } from "mongoose";

export type MentorSessionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "rejected"
  | "completed";

export type MentorSessionPaymentStatus = "unpaid" | "paid";

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
  status: MentorSessionStatus;
  paymentStatus: MentorSessionPaymentStatus;
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
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "rejected", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    roomId: { type: String, default: "", trim: true },
    goals: { type: [String], default: [] },
    attachments: { type: [MentorSessionAttachmentSchema], default: [] },
    privateNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

MentorSessionSchema.index({ studentId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ mentorId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ status: 1, paymentStatus: 1 });

export default mongoose.models.MentorSession ||
  mongoose.model<IMentorSession>("MentorSession", MentorSessionSchema);
