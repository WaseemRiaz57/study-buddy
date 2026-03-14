import mongoose, { Schema, Document } from "mongoose";

export type AINoteType = "notes" | "summarizer" | "quiz";

export interface IAINote extends Document {
  userId: string;
  title: string;
  content: string;
  type: AINoteType;
  createdAt: Date;
  updatedAt: Date;
}

const AINoteSchema = new Schema<IAINote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["notes", "summarizer", "quiz"], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AINote || mongoose.model<IAINote>("AINote", AINoteSchema);