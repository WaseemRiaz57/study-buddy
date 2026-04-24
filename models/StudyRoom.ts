import mongoose, { Schema, Document } from "mongoose";

export interface IStudyRoom extends Document {
  roomId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  isActive: boolean;
  status: string;
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    maxParticipants: {
      type: Number,
      default: 20,
      min: 2,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      default: "active",
      index: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

StudyRoomSchema.index({ roomId: 1 }, { unique: true });
StudyRoomSchema.index({ isLive: 1, createdAt: -1 });
StudyRoomSchema.index({ isActive: 1, status: 1, createdAt: -1 });

export default mongoose.models.StudyRoom ||
  mongoose.model<IStudyRoom>("StudyRoom", StudyRoomSchema);
