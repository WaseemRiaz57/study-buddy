import mongoose, { Document, Schema, models } from "mongoose";

export interface IResource extends Document {
  title: string;
  subject: string;
  description: string;
  tags: string[];
  fileUrl: string;
  fileSize: string;
  fileType: string;
  pageCount: number;
  rating: number;
  downloadCount: number;
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
  fileType: {
    type: String,
    required: true,
  },
  pageCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
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

const Resource = models.Resource || mongoose.model<IResource>("Resource", resourceSchema);

export default Resource;