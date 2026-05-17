import mongoose, { Schema, type Document } from "mongoose";

export type BadgeRarity = "common" | "rare" | "legendary";

export interface IBadge extends Document {
  title: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  metricLabel: string;
  targetValue: number;
  xpBonus: number;
  coinBonus: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    icon: { type: String, default: "Award", trim: true },
    rarity: {
      type: String,
      enum: ["common", "rare", "legendary"],
      default: "common",
      index: true,
    },
    metricLabel: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    targetValue: { type: Number, required: true, min: 1 },
    xpBonus: { type: Number, default: 0, min: 0 },
    coinBonus: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BadgeSchema.index({ metricLabel: 1, isActive: 1 });

export default mongoose.models.Badge ||
  mongoose.model<IBadge>("Badge", BadgeSchema);
