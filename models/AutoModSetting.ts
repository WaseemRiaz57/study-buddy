import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAutoModSetting extends Document {
  banAfterStrikes: number;
  strikeExpiryDays: number;
  restrictedKeywords: string[];
  autoFlagAI: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutoModSettingSchema = new Schema<IAutoModSetting>(
  {
    banAfterStrikes: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    strikeExpiryDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 3650,
    },
    restrictedKeywords: {
      type: [String],
      default: [],
      set: (keywords: string[]) =>
        Array.isArray(keywords)
          ? [
              ...new Set(
                keywords
                  .map((keyword) => String(keyword || "").trim().toLowerCase())
                  .filter(Boolean)
                  .slice(0, 200)
              ),
            ]
          : [],
    },
    autoFlagAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AutoModSetting: Model<IAutoModSetting> =
  mongoose.models.AutoModSetting ||
  mongoose.model<IAutoModSetting>("AutoModSetting", AutoModSettingSchema);

export default AutoModSetting;
