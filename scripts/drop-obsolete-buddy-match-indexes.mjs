import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI or MONGO_URI is required to drop BuddyMatch indexes.");
}

const obsoleteIndexNames = [
  "studentId_1_matchedPeerId_1_subject_1_status_1",
  "studentId_1_subject_1_status_1",
];

try {
  await mongoose.connect(mongoUri, { bufferCommands: false });

  const collection = mongoose.connection.collection("buddymatches");
  const existingIndexes = await collection.indexes();
  const existingIndexNames = new Set(existingIndexes.map((index) => index.name));

  for (const indexName of obsoleteIndexNames) {
    if (!existingIndexNames.has(indexName)) {
      console.log(`Skipped missing index: ${indexName}`);
      continue;
    }

    await collection.dropIndex(indexName);
    console.log(`Dropped obsolete BuddyMatch index: ${indexName}`);
  }
} finally {
  await mongoose.disconnect();
}
