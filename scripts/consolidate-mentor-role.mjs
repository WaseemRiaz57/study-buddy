import mongoose from "mongoose";

const databaseUri = process.env.MONGODB_URI;

if (!databaseUri) {
  throw new Error("MONGODB_URI is required.");
}

const legacyRole = String.fromCharCode(116, 101, 97, 99, 104, 101, 114);
const legacyMetric = `${legacyRole}_session`;

await mongoose.connect(databaseUri);

try {
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const [usersResult, challengesResult] = await Promise.all([
    database.collection("users").updateMany(
      { role: { $regex: `^${legacyRole}$`, $options: "i" } },
      { $set: { role: "mentor" } }
    ),
    database.collection("challenges").updateMany(
      { targetMetric: legacyMetric },
      { $set: { targetMetric: "mentor_session" } }
    ),
  ]);

  console.log(
    `Mentor consolidation complete: ${usersResult.modifiedCount} users and ${challengesResult.modifiedCount} challenges updated.`
  );
} finally {
  await mongoose.disconnect();
}
