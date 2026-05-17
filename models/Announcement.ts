import mongoose, { Schema, Document } from "mongoose";

export type AnnouncementAudience = "all" | "students" | "mentors";

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  targetAudience: AnnouncementAudience;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    content: { type: String, required: true, trim: true, maxlength: 1200 },
    targetAudience: {
      type: String,
      enum: ["all", "students", "mentors"],
      required: true,
      default: "all",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, expiresAt: 1, createdAt: -1 });

export default mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
