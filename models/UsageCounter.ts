import mongoose, { Schema, models } from "mongoose";

const UsageCounterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      index: true,
    },
    windowStart: {
      type: Date,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

UsageCounterSchema.index(
  { userId: 1, feature: 1, windowStart: 1 },
  { unique: true }
);

export default models.UsageCounter ||
  mongoose.model("UsageCounter", UsageCounterSchema);
