import mongoose, { Schema, Document } from "mongoose";

export interface IStudyRoom extends Document {
  roomId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  participants: mongoose.Types.ObjectId[];
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
    isLive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

StudyRoomSchema.index({ roomId: 1 }, { unique: true });
StudyRoomSchema.index({ isLive: 1, createdAt: -1 });

export default mongoose.models.StudyRoom ||
  mongoose.model<IStudyRoom>("StudyRoom", StudyRoomSchema);
