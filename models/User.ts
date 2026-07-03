import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
      enum: ["student", "teacher", "admin", "mentor"],
      default: "student", // Jo naya sign up karega wo default student banega
    },
    plan: {
      type: String,
      enum: ["FREE", "PRO", "ELITE"],
      default: "FREE",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
      index: true,
    },
    activeStrikes: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    // Naya feature: Study with Buddy ke liye topics (Static Profile)
    subjects: {
      type: [String],
      default: [],
    },
    // Naya feature: Matchmaking ke liye online status
    isOnline: {
      type: Boolean,
      default: false,
    },
    // Naya feature: Dynamic Presence (Aaj ka focus / Custom Session)
    currentStudyTopic: {
      type: String,
      default: "", // Default khali hoga. Jab user search karega toh yeh update hoga.
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isLeaderboardBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    // ── Account security (Account & Security settings) ──
    // Email one-time-code MFA on new logins.
    emailMfaEnabled: {
      type: Boolean,
      default: false,
    },
    // FaceID / TouchID biometric login on supported devices.
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    // True once the user sets a password that passes our strength rule. Feeds the
    // security score (base 50, +25 MFA, +25 strong password).
    passwordStrong: {
      type: Boolean,
      default: false,
    },
    passwordUpdatedAt: {
      type: Date,
    },
    savedPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "CommunityPost",
        index: true,
      },
    ],
  },
  { timestamps: true } // Yeh automatically createdAt aur updatedAt fields bana dega
);

userSchema.index({ name: 1 });

// Next.js mein models ko cache se check karna zaroori hai taake re-compilation error na aaye
const User = models.User || mongoose.model("User", userSchema);

export default User;
