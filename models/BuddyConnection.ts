import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type BuddyConnectionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed";

export interface IBuddyConnection extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  listingId?: Types.ObjectId;
  subject: string;
  roomId?: string;
  status: BuddyConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const buddyConnectionSchema = new Schema<IBuddyConnection>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "BuddyMatch",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    roomId: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

buddyConnectionSchema.index({ requester: 1, status: 1 });
buddyConnectionSchema.index({ recipient: 1, status: 1 });
buddyConnectionSchema.index({ listingId: 1, status: 1 });
buddyConnectionSchema.index({ requester: 1, recipient: 1, status: 1 });

const BuddyConnection: Model<IBuddyConnection> =
  mongoose.models.BuddyConnection ||
  mongoose.model<IBuddyConnection>("BuddyConnection", buddyConnectionSchema);

export default BuddyConnection;
