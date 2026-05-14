import mongoose, { Schema, Document } from "mongoose";

export interface IMentorAvailability {
  day: string;
  slots: string[];
  timeSlots?: string[];
}

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  headline: string;
  bio: string;
  subjects: string[];
  hourlyRate: number;
  certificates: string[];
  totalEarnings: number;
  rating: number;
  availability: IMentorAvailability[];
  status: "pending" | "approved" | "rejected" | "suspended";
  isPublic: boolean;
}

function parseMeridiemTimeToMinutes(
  hour: string,
  minute: string,
  meridiem: string
) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);

  if (
    !Number.isInteger(parsedHour) ||
    !Number.isInteger(parsedMinute) ||
    parsedHour < 1 ||
    parsedHour > 12 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return null;
  }

  const hour24 =
    meridiem.toUpperCase() === "AM"
      ? parsedHour === 12
        ? 0
        : parsedHour
      : parsedHour === 12
        ? 12
        : parsedHour + 12;

  return hour24 * 60 + parsedMinute;
}

function isOneHourSlot(slot: string) {
  const match = slot.match(
    /^(\d{1,2}):([0-5]\d)\s*(AM|PM)\s*-\s*(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i
  );

  if (!match) return false;

  const start = parseMeridiemTimeToMinutes(match[1], match[2], match[3]);
  const end = parseMeridiemTimeToMinutes(match[4], match[5], match[6]);

  if (start === null || end === null) return false;

  const duration = end > start ? end - start : end + 24 * 60 - start;
  return duration === 60;
}

const MentorAvailabilitySchema = new Schema<IMentorAvailability>(
  {
    day: { type: String, required: true, trim: true },
    slots: {
      type: [String],
      default: [],
      validate: {
        validator: (slots: string[]) => slots.every(isOneHourSlot),
        message:
          "Mentor availability slots must use 1-hour intervals like '09:00 AM - 10:00 AM'.",
      },
    },
    timeSlots: {
      type: [String],
      default: [],
      validate: {
        validator: (slots: string[]) => slots.every(isOneHourSlot),
        message:
          "Mentor availability slots must use 1-hour intervals like '09:00 AM - 10:00 AM'.",
      },
    },
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
    headline: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 500 },
    subjects: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    certificates: { type: [String], default: [] },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    availability: { type: [MentorAvailabilitySchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

MentorProfileSchema.index({ userId: 1 }, { unique: true });
MentorProfileSchema.index({ status: 1, isPublic: 1 });

MentorProfileSchema.pre("validate", function syncAvailabilityAliases() {
  this.availability = this.availability.map((availability) => {
    const slots = availability.slots?.length
      ? availability.slots
      : availability.timeSlots || [];

    return {
      day: availability.day,
      slots,
      timeSlots: slots,
    };
  });

  this.isPublic = this.status === "approved" ? this.isPublic : false;
});

export default mongoose.models.MentorProfile ||
  mongoose.model<IMentorProfile>("MentorProfile", MentorProfileSchema);
