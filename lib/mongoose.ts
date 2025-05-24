// lib/mongoose.ts
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(MONGODB_URI!);
    isConnected = true;
    console.log("MongoDB connected");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}
