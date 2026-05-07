import mongoose, { Schema, Document } from "mongoose";

export interface IBuddyMatch extends Document {
  studentId: mongoose.Types.ObjectId;
  matchedPeerId?: mongoose.Types.ObjectId; // 👈 Optional kar diya hai kyunke shuru mein peer nahi hoga
  subject: string;
  topic?: string; // 👈 Naya field topic ke liye
  status: "Searching" | "Pending" | "Connected" | "Rejected"; // 👈 Naye states
  roomId?: mongoose.Types.ObjectId; // 👈 LiveKit StudyRoom se link karne ke liye
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
      // required: true hata diya hai
    },
    subject: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Searching", "Pending", "Connected", "Rejected"],
      default: "Searching",
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "StudyRoom",
    },
  },
  { timestamps: true }
);

// 👈 Naya Index: Ek user ek hi waqt mein same subject ke liye 2 dafa "Searching" na kar sake
BuddyMatchSchema.index(
  { studentId: 1, subject: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Searching" } }
);

BuddyMatchSchema.index({ studentId: 1, status: 1 });
BuddyMatchSchema.index({ matchedPeerId: 1, status: 1 });

export default mongoose.models.BuddyMatch ||
  mongoose.model<IBuddyMatch>("BuddyMatch", BuddyMatchSchema);