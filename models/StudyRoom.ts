import mongoose, { Schema, Document } from "mongoose";

export interface IStudyRoom extends Document {
  studentIds: mongoose.Types.ObjectId[];
  activeStatus: boolean;
  startTime: Date;
  endTime: Date | null;
  communicationChannel: string;
  sharedMaterialIds: mongoose.Types.ObjectId[];
}

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    studentIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length >= 2,
        message: "A study room requires at least 2 students.",
      },
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    communicationChannel: {
      type: String, // WebRTC / Agora channel reference
      default: "",
    },
    sharedMaterialIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

StudyRoomSchema.index({ studentIds: 1, activeStatus: 1 });

export default mongoose.models.StudyRoom ||
  mongoose.model<IStudyRoom>("StudyRoom", StudyRoomSchema);
