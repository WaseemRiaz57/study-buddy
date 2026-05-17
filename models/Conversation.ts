import mongoose, { Document, Model, Schema } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: string;
  lastMessageAt: Date;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
