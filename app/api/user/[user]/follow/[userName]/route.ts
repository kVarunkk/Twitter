import { NextResponse } from "next/server";
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ user: string; userName: string }> }
) {
  try {
    const { user, userName } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    // Ensure the active user is not trying to follow themselves
    if (user === userName) {
      return NextResponse.json(
        { status: "error", message: "You cannot follow yourself." },
        { status: 400 }
      );
    }

    // Find the profile user (the user being followed/unfollowed)
    const profileUser = await User.findOne({ username: userName });
    if (!profileUser) {
      return NextResponse.json(
        { status: "error", message: "User not found." },
        { status: 404 }
      );
    }

    // Check if the active user is already following the profile user
    const isFollowing = profileUser.followers.includes(user);

    if (!isFollowing) {
      // Follow the user
      profileUser.followers.push(user);
      await profileUser.save();

      return NextResponse.json({
        status: "ok",
        followers: profileUser.followers.length,
        followBtn: "Following",
      });
    } else {
      // Unfollow the user
      profileUser.followers = profileUser.followers.filter(
        (follower) => follower !== user
      );
      await profileUser.save();

      return NextResponse.json({
        status: "ok",
        followers: profileUser.followers.length,
        followBtn: "Follow",
      });
    }
  } catch (err) {
    console.error("Error updating follow status:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
