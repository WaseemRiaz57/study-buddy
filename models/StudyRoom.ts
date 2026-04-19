import mongoose, { Schema, Document } from "mongoose";

export interface IStudyRoom extends Document {
  topic: string;
  roomId: string;
  maxParticipants: number;
  privacy: "Public" | "Invite";
  host: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  isLive: boolean;
  closedAt: Date | null;
  sessionDurationMinutes: number;
  createdAt: Date;
}

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    maxParticipants: {
      type: Number,
      default: 20,
      min: 2,
    },
    privacy: {
      type: String,
      enum: ["Public", "Invite"],
      default: "Public",
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    sessionDurationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

StudyRoomSchema.index({ isLive: 1, privacy: 1, createdAt: -1 });

export default mongoose.models.StudyRoom ||
  mongoose.model<IStudyRoom>("StudyRoom", StudyRoomSchema);
