import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/trim";

export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(MONGODB_URI);

  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
