import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
const { User, Tweet, Comment } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(req: Request) {
  try {
    const users = await User.find({
      $or: [
        { publicKey: { $exists: false } },
        { encryptedPrivateKey: { $exists: false } },
        { iv: { $exists: false } },
        { derivedKey: { $exists: false } },
      ],
    }).select("_id username"); // Only fetch necessary fields

    return NextResponse.json({ status: "ok", users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
