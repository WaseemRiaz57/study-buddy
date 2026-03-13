import mongoose, { Schema, Document } from "mongoose";

export interface IBuddyMatch extends Document {
  studentId: mongoose.Types.ObjectId;
  matchedPeerId: mongoose.Types.ObjectId;
  subject: string;
  status: "Pending" | "Connected";
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
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Connected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests between the same pair for the same subject
BuddyMatchSchema.index(
  { studentId: 1, matchedPeerId: 1, subject: 1, status: 1 },
  { unique: true }
);

BuddyMatchSchema.index({ studentId: 1, status: 1 });
BuddyMatchSchema.index({ matchedPeerId: 1, status: 1 });

export default mongoose.models.BuddyMatch ||
  mongoose.model<IBuddyMatch>("BuddyMatch", BuddyMatchSchema);
