import mongoose, { Schema, Document } from "mongoose";

export interface IStudyProfile extends Document {
  userId: string;
  name: string;
  image: string;
  isOnline: boolean;
  isLookingForMatch: boolean;
  currentSubject: string;
  currentTopic: string;
  tags: string[];
}

const StudyProfileSchema = new Schema<IStudyProfile>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    isLookingForMatch: { type: Boolean, default: false },
    currentSubject: { type: String, default: "" },
    currentTopic: { type: String, default: "" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.StudyProfile ||
  mongoose.model<IStudyProfile>("StudyProfile", StudyProfileSchema);
