// models/UserProgress.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUserProgress extends Document {
  userId: string;
  xp: number;
  level: number;
  todayMinutes: number;
  lastActiveDate: Date;
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: String, required: true, unique: true }, // User ka email hoga
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    todayMinutes: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.UserProgress || mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);