import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI or MONGO_URI is required to run this migration.");
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const BuddyMatchSchema = new mongoose.Schema(
  {
    status: String,
    expiresAt: Date,
    createdAt: Date,
  },
  { collection: "buddymatches", strict: false }
);

const BuddyMatch =
  mongoose.models.BuddyMatch || mongoose.model("BuddyMatch", BuddyMatchSchema);

await mongoose.connect(mongoUri);

const result = await BuddyMatch.updateMany(
  {
    status: "Searching",
    $or: [
      { expiresAt: { $lte: new Date() } },
      { expiresAt: { $exists: false }, createdAt: { $lte: sevenDaysAgo } },
    ],
  },
  {
    $set: {
      status: "Expired",
      expiresAt: new Date(),
    },
  }
);

console.log(`Closed ${result.modifiedCount || 0} expired Study Buddy listings.`);

await mongoose.disconnect();
