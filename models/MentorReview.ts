import mongoose, { Schema, Document } from "mongoose";

export interface IMentorReview extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const MentorReviewSchema = new Schema<IMentorReview>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "MentorSession",
      required: true,
      unique: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

MentorReviewSchema.index({ mentorId: 1, createdAt: -1 });
MentorReviewSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.models.MentorReview ||
  mongoose.model<IMentorReview>("MentorReview", MentorReviewSchema);
