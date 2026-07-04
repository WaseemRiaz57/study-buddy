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
  /** Primary Student — kept for backward compatibility with existing sessions. */
  studentId: mongoose.Types.ObjectId;
  /**
   * Multi-student group session support.
   * Contains all Students in this session (including the primary Student).
   * Maximum: 4 Students per Mentor session.
   */
  students: mongoose.Types.ObjectId[];
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
  isSessionStarted: boolean;
  mentorJoinedAt?: Date;
  studentJoinedAt?: Date;
  completedAt?: Date;
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
    /** Primary Student reference — preserved for backward compatibility. */
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /**
     * Group session Students array — max 4 Students per Mentor session.
     * Populated by the Mentor via the Invite Students feature.
     */
    students: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      validate: {
        validator(arr: mongoose.Types.ObjectId[]) {
          return arr.length <= 4;
        },
        message: "A Mentor session supports a maximum of 4 Students.",
      },
    },
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
    isSessionStarted: { type: Boolean, default: false },
    mentorJoinedAt: { type: Date },
    studentJoinedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

MentorSessionSchema.index({ studentId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ mentorId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ mentorId: 1, status: 1, scheduledAt: 1 });
MentorSessionSchema.index({ status: 1, paymentStatus: 1 });
MentorSessionSchema.index({ type: 1, status: 1 });
/** Enables efficient lookup of all sessions a Student (group member) is part of. */
MentorSessionSchema.index({ mentorId: 1, students: 1 });

export default mongoose.models.MentorSession ||
  mongoose.model<IMentorSession>("MentorSession", MentorSessionSchema);
