import mongoose, { Schema, type Document } from "mongoose";

export interface IUserMetric extends Document {
  userId: mongoose.Types.ObjectId;
  metricLabel: string;
  totalValue: number;
  updatedAt: Date;
}

const UserMetricSchema = new Schema<IUserMetric>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    metricLabel: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    totalValue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

UserMetricSchema.index({ userId: 1, metricLabel: 1 }, { unique: true });

export default mongoose.models.UserMetric ||
  mongoose.model<IUserMetric>("UserMetric", UserMetricSchema);
