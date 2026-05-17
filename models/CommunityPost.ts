import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  category: string;
  attachments: string[];
  likes: mongoose.Types.ObjectId[];
  views: number;
  isPinned: boolean;
  status: "Published" | "Flagged";
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 180,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 12000,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) =>
        Array.isArray(tags)
          ? [
              ...new Set(
                tags
                  .map((tag) => String(tag || "").trim().replace(/^#/, ""))
                  .filter(Boolean)
                  .slice(0, 8)
              ),
            ]
          : [],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["Published", "Flagged"],
      default: "Published",
      index: true,
    },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ isPinned: -1, createdAt: -1 });
CommunityPostSchema.index({ createdAt: -1 });
CommunityPostSchema.index({ category: 1, createdAt: -1 });

const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);

export default CommunityPost;
