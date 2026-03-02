import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // Password required nahi rakha kyunke Google Login walo ka password nahi hoga
      required: false, 
    },
    image: {
      type: String,
      required: false, // Profile picture ke liye
    },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student", // Jo naya sign up karega wo default student banega
    },
  },
  { timestamps: true } // Yeh automatically createdAt aur updatedAt fields bana dega
);

const User = models.User || mongoose.model("User", userSchema);

export default User;