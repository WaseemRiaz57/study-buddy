import mongoose, { Schema, Document } from "mongoose";

export type ChallengeType = "daily" | "weekly" | "global" | "elite";

export interface IChallenge extends Document {
  title: string;
  description: string;
  type: ChallengeType;
  targetMetric: number;
  metricLabel: string;
  xpReward: number;
  coinsReward: number;
  isActive: boolean;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      enum: ["daily", "weekly", "global", "elite"],
      required: true,
      index: true,
    },
    targetMetric: { type: Number, required: true, min: 1 },
    metricLabel: { type: String, default: "items", trim: true, maxlength: 40 },
    xpReward: { type: Number, required: true, min: 0 },
    coinsReward: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ChallengeSchema.index({ isActive: 1, type: 1, createdAt: -1 });

export default mongoose.models.Challenge ||
  mongoose.model<IChallenge>("Challenge", ChallengeSchema);
