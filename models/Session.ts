import mongoose, { Schema, models } from "mongoose";

/**
 * Device/login session log.
 *
 * The app uses NextAuth's JWT session strategy, so there is no adapter-managed
 * session collection. This model is our own audit log of active logins: one row
 * is written per successful sign-in (see lib/authOptions.ts), keyed by `sid`,
 * which is also embedded in the JWT so we can identify the *current* device.
 */
const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Opaque session id mirrored in the JWT (`token.sid`) — links a row to a device.
    sid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    device: { type: String, default: "Unknown device" }, // e.g. 'Apple iPhone'
    os: { type: String, default: "" }, // e.g. 'macOS 13.4'
    browser: { type: String, default: "" }, // e.g. 'Chrome 124'
    deviceType: {
      type: String,
      enum: ["laptop", "phone", "tablet"],
      default: "laptop",
    },
    ipAddress: { type: String, default: "" },
    location: { type: String, default: "Unknown location" }, // e.g. 'Lahore, PK'
    lastActive: { type: Date, default: Date.now, index: true },
    // Stored hint; the API is the source of truth (it compares `sid` to the JWT).
    isCurrentSession: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-expire stale device sessions after 30 days of inactivity (matches the
// default JWT maxAge) so the log self-cleans without a cron job.
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Session = models.UserSession || mongoose.model("UserSession", sessionSchema);

export default Session;
