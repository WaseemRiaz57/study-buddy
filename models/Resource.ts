import mongoose, { Document, Schema, models } from "mongoose";

export interface IResource extends Document {
  title: string;
  subject: string;
  description: string;
  tags: string[];
  fileUrl: string;
  fileSize: string;
  size: number;
  fileType: string;
  status: "pending" | "approved" | "rejected";
  pageCount: number;
  rating: number;
  ratings: {
    userId: mongoose.Types.ObjectId;
    score: number;
  }[];
  reviews: {
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
  averageRating: number;
  downloadCount: number;
  price: number;
  allowedUsers: mongoose.Types.ObjectId[];
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const resourceSchema = new Schema<IResource>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 0,
    min: 0,
  },
  fileType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  ratings: {
    type: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
      },
    ],
    default: [],
  },
  reviews: {
    type: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          default: "",
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  allowedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

resourceSchema.pre("validate", function ensureUploaderAccess() {
  if (!this.uploadedBy) return;

  const uploaderId = this.uploadedBy.toString();
  const allowedUsers = this.allowedUsers || [];
  const hasUploaderAccess = allowedUsers.some(
    (userId) => userId.toString() === uploaderId
  );

  if (!hasUploaderAccess) {
    allowedUsers.push(this.uploadedBy);
    this.allowedUsers = allowedUsers;
  }
});

const Resource = models.Resource || mongoose.model<IResource>("Resource", resourceSchema);

export default Resource;
