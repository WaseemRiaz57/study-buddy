import mongoose, { Schema, type Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctOption: string;
  explanation: string;
}

export interface IQuiz extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true, validate: (value: string[]) => value.length >= 2 },
    correctOption: { type: String, required: true, trim: true },
    explanation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    questions: { type: [QuizQuestionSchema], default: [] },
  },
  { timestamps: true }
);

QuizSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
