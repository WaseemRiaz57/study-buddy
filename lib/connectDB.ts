import { connectMongoDB } from "@/lib/mongodb";

export async function connectDB() {
  return connectMongoDB();
}

