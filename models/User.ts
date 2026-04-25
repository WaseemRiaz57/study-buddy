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
    // Naya feature: Study with Buddy ke liye topics
    subjects: {
      type: [String],
      default: [],
    },
    // Naya feature: Matchmaking ke liye online status
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Yeh automatically createdAt aur updatedAt fields bana dega
);

// Next.js mein models ko cache se check karna zaroori hai taake re-compilation error na aaye
const User = models.User || mongoose.model("User", userSchema);

export default User;