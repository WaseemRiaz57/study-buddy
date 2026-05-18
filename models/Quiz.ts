import mongoose, { Schema, type Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options?: string[];
  correctOption?: string;
  suggestedAnswer?: string;
  explanation: string;
}

export interface IQuiz extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "mcq" | "short" | "long";
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    correctOption: { type: String, default: "", trim: true },
    suggestedAnswer: { type: String, default: "", trim: true },
    explanation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    questionType: { type: String, enum: ["mcq", "short", "long"], default: "mcq" },
    questions: { type: [QuizQuestionSchema], default: [] },
  },
  { timestamps: true }
);

QuizSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
