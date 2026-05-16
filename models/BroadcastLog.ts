import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBroadcastLog extends Document {
  title: string;
  message: string;
  deliveryMethods: string[];
  audience: string;
  targetCount: number;
  emailSuccessCount: number;
  emailFailureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastLogSchema = new Schema<IBroadcastLog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    deliveryMethods: {
      type: [String],
      default: [],
    },
    audience: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailSuccessCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailFailureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

BroadcastLogSchema.index({ createdAt: -1 });

const BroadcastLog: Model<IBroadcastLog> =
  mongoose.models.BroadcastLog ||
  mongoose.model<IBroadcastLog>("BroadcastLog", BroadcastLogSchema);

export default BroadcastLog;
