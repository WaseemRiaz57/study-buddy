// models/Task.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  userId: string;
  text: string;
  done: boolean;
  priority: "High" | "Med" | "Low";
}

const TaskSchema = new Schema<ITask>(
  {
    // Har task ke sath user ki ID save hogi taake har kisi ko sirf apne tasks nazar aayein
    userId: { type: String, required: true }, 
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
    priority: { type: String, enum: ["High", "Med", "Low"], default: "Med" },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);