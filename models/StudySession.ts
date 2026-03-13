import mongoose, { Schema, Document } from "mongoose";

export interface IStudySession extends Document {
  requesterId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  status: "pending" | "accepted" | "rejected" | "active" | "completed";
  selectedMode: "chat" | "video" | null;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, default: "" },
    topic: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "active", "completed"],
      default: "pending",
    },
    selectedMode: {
      type: String,
      enum: ["chat", "video"],
      default: null,
    },
  },
  { timestamps: true }
);

StudySessionSchema.index({ receiverId: 1, status: 1 });
StudySessionSchema.index({ requesterId: 1, status: 1 });

export default mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);
