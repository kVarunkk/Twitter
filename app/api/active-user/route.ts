import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

const { User } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(req: NextRequest) {
  try {
    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    // Find the user whose profile is being requested
    const profileUser = await User.findOne({
      username: user.username,
    });

    if (!profileUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "ok",
      user: {
        username: profileUser.username,
        avatar: profileUser.avatar,
        bio: profileUser.bio,
        followers: profileUser.followers.length,
        tweetGenCount: profileUser.tweetGenCount ?? 0,
        tweetReplyGenCount: profileUser.tweetReplyGenCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
