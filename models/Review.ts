import mongoose, { Schema, type Document } from "mongoose";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
