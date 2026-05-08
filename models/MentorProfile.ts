import mongoose, { Schema, Document } from "mongoose";

export interface IMentorAvailability {
  day: string;
  timeSlots: string[];
}

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  subjects: string[];
  hourlyRate: number;
  totalEarnings: number;
  rating: number;
  bio: string;
  availability: IMentorAvailability[];
}

const MentorAvailabilitySchema = new Schema<IMentorAvailability>(
  {
    day: { type: String, required: true, trim: true },
    timeSlots: { type: [String], default: [] },
  },
  { _id: false }
);

const MentorProfileSchema = new Schema<IMentorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjects: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    availability: { type: [MentorAvailabilitySchema], default: [] },
  },
  { timestamps: true }
);

MentorProfileSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.MentorProfile ||
  mongoose.model<IMentorProfile>("MentorProfile", MentorProfileSchema);
