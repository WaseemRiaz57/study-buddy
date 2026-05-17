import mongoose, { Schema, type Document } from "mongoose";

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  earnedAt: Date;
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
UserBadgeSchema.index({ badgeId: 1, earnedAt: -1 });

export default mongoose.models.UserBadge ||
  mongoose.model<IUserBadge>("UserBadge", UserBadgeSchema);
