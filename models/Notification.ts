import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId | null;
  type:
    | "buddy_request"
    | "buddy_accepted"
    | "room_created"
    | "room_ended"
    | "challenge"
    | "system";
  title: string;
  message: string;
  audience?: string;
  read: boolean;
  readBy?: mongoose.Types.ObjectId[];
  isGlobal: boolean;
  metadata: Record<string, unknown>;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "buddy_request",
        "buddy_accepted",
        "room_created",
        "room_ended",
        "challenge",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    audience: {
      type: String,
      default: "",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
