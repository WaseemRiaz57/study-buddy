import mongoose, { Schema, type Document } from "mongoose";

export type AIContentType = "notes" | "summarizer";

export interface IAIContent extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  generatedText: string;
  type: AIContentType;
  createdAt: Date;
  updatedAt: Date;
}

const AIContentSchema = new Schema<IAIContent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, required: true, trim: true, maxlength: 12000 },
    generatedText: { type: String, required: true, maxlength: 100000 },
    type: { type: String, enum: ["notes", "summarizer"], required: true, index: true },
  },
  { timestamps: true }
);

AIContentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AIContent ||
  mongoose.model<IAIContent>("AIContent", AIContentSchema);
