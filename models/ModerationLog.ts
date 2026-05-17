import mongoose, { Document, Model, Schema } from "mongoose";

export type ModerationActionType = "warning" | "strike" | "ban";

export interface IModerationLog extends Document {
  userId: mongoose.Types.ObjectId;
  actionType: ModerationActionType;
  reason: string;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationLogSchema = new Schema<IModerationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ["warning", "strike", "ban"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

ModerationLogSchema.index({ isActive: 1, actionType: 1, createdAt: -1 });

const ModerationLog: Model<IModerationLog> =
  mongoose.models.ModerationLog ||
  mongoose.model<IModerationLog>("ModerationLog", ModerationLogSchema);

export default ModerationLog;
