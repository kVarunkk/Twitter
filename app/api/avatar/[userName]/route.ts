import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
const { User, Tweet, Comment } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    const { userName } = await params;
    const { avatar } = await req.json();

    // Find the user by username
    const user = await User.findOne({ username: userName });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Update the user's avatar
    user.avatar = avatar;
    await user.save();

    return NextResponse.json({
      status: "ok",
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("Error updating avatar:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
