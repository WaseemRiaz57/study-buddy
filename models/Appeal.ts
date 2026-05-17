import mongoose, { Document, Model, Schema } from "mongoose";

export type AppealStatus = "pending" | "approved" | "rejected";

export interface IAppeal extends Document {
  userId: mongoose.Types.ObjectId;
  logId?: mongoose.Types.ObjectId | null;
  message: string;
  status: AppealStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AppealSchema = new Schema<IAppeal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    logId: {
      type: Schema.Types.ObjectId,
      ref: "ModerationLog",
      required: false,
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

AppealSchema.index({ status: 1, createdAt: -1 });

const Appeal: Model<IAppeal> =
  mongoose.models.Appeal || mongoose.model<IAppeal>("Appeal", AppealSchema);

export default Appeal;
