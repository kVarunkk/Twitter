import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
const { User } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ user: string }> }
) {
  try {
    const { user } = await params;

    // Search for users matching the query
    const users = await User.find({
      username: { $regex: `${user}`, $options: "i" },
    });

    return NextResponse.json({ status: "ok", users });
  } catch (err) {
    console.error("Error searching users:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
