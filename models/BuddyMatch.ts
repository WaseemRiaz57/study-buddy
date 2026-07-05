import mongoose, { Schema, Document } from "mongoose";

export interface IBuddyMatch extends Document {
  studentId: mongoose.Types.ObjectId;
  matchedPeerId?: mongoose.Types.ObjectId;
  subject: string;
  topic?: string;
  status:
    | "Searching"
    | "Pending"
    | "Connected"
    | "Rejected"
    | "Expired"
    | "Completed"
    | "Closed";
  roomId?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BuddyMatchSchema = new Schema<IBuddyMatch>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchedPeerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Searching",
        "Pending",
        "Connected",
        "Rejected",
        "Expired",
        "Completed",
        "Closed",
      ],
      default: "Searching",
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "StudyRoom",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

BuddyMatchSchema.index({ studentId: 1, status: 1 });
BuddyMatchSchema.index({ matchedPeerId: 1, status: 1 });
BuddyMatchSchema.index({ status: 1, expiresAt: 1, createdAt: 1 });

export default mongoose.models.BuddyMatch ||
  mongoose.model<IBuddyMatch>("BuddyMatch", BuddyMatchSchema);
