import mongoose, { Schema, models } from "mongoose";

const FocusSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    taskId: {
      type: String,
      default: "",
      trim: true,
    },
    taskTitle: {
      type: String,
      default: "",
      trim: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

FocusSessionSchema.index({ userId: 1, completedAt: -1 });

export default models.FocusSession ||
  mongoose.model("FocusSession", FocusSessionSchema);
