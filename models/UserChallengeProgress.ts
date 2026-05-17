import mongoose, { Schema, Document } from "mongoose";

export interface IUserChallengeProgress extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  lastUpdated: Date;
}

const UserChallengeProgressSchema = new Schema<IUserChallengeProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    challengeId: { type: Schema.Types.ObjectId, ref: "Challenge", required: true },
    currentValue: { type: Number, default: 0, min: 0 },
    isCompleted: { type: Boolean, default: false },
    isClaimed: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserChallengeProgressSchema.index(
  { userId: 1, challengeId: 1 },
  { unique: true }
);
UserChallengeProgressSchema.index({ challengeId: 1, isCompleted: 1 });

export default mongoose.models.UserChallengeProgress ||
  mongoose.model<IUserChallengeProgress>(
    "UserChallengeProgress",
    UserChallengeProgressSchema
  );
