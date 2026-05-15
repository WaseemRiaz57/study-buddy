import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPlatformSettings extends Document {
  platformName: string;
  platformLogo?: string;
  supportEmail: string;
  allowNewSignups: boolean;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformName: {
      type: String,
      default: "StudyBuddy",
      trim: true,
      maxlength: 100,
    },
    platformLogo: {
      type: String,
      default: "",
    },
    supportEmail: {
      type: String,
      default: "support@studybuddy.io",
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    allowNewSignups: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>(
    "PlatformSettings",
    PlatformSettingsSchema
  );

export default PlatformSettings;
