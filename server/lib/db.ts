import mongoose from "mongoose";
import { config } from "../config";

mongoose.set("strictQuery", true);

export async function connectDB() {
  await mongoose.connect(config.dbUrl, { dbName: config.dbName, serverSelectionTimeoutMS: 15000 });
  console.log("✅ MongoDB connected");
}
