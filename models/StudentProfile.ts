import mongoose, { Schema, Document } from "mongoose";

export type StudentSubscriptionTier =
  | "Standard"
  | "Pro Scholar"
  | "Elite Master";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  headline: string;
  bio: string;
  academicLevel: string;
  primaryGoal: string;
  interestedSubjects: string[];
  weeklyCommitment: number;
  preferredStudyTimes: string[];
  socraticAiMode: boolean;
  strictMentorship: boolean;
  subscriptionTier: StudentSubscriptionTier;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    headline: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 500 },
    academicLevel: { type: String, default: "", trim: true },
    primaryGoal: { type: String, default: "", trim: true },
    interestedSubjects: { type: [String], default: [] },
    weeklyCommitment: { type: Number, default: 0, min: 0 },
    preferredStudyTimes: { type: [String], default: [] },
    socraticAiMode: { type: Boolean, default: false },
    strictMentorship: { type: Boolean, default: false },
    subscriptionTier: {
      type: String,
      enum: ["Standard", "Pro Scholar", "Elite Master"],
      default: "Standard",
    },
  },
  { timestamps: true }
);

StudentProfileSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
