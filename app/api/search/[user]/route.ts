import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

const { User, Tweet } = require("utils/models/File");

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
    const url = new URL(req.url);
    const tweetsToSkip = parseInt(url.searchParams.get("skip") || "0"); // Pagination: Number of tweets to skip
    const tweetsLimit = parseInt(url.searchParams.get("limit") || "10"); // Pagination: Number of tweets to fetch per request

    // Validate the token and get the active user
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }
    const activeUser = validationResponse.user.username;

    // Search for users matching the query
    const users = await User.find({
      username: { $regex: `${user}`, $options: "i" },
    });

    // Search for tweets matching the query with pagination
    const tweets = await Tweet.find({
      content: { $regex: `${user}`, $options: "i" },
    })
      .populate("postedBy", "username avatar")
      .populate("comments")
      .sort({ createdAt: -1 }) // Sort tweets by creation date (newest first)
      .skip(tweetsToSkip) // Skip the specified number of tweets
      .limit(tweetsLimit); // Limit the number of tweets returned

    return NextResponse.json({
      status: "ok",
      users,
      tweets,
      activeUser, // Include the active user in the response
    });
  } catch (err) {
    console.error("Error searching users and tweets:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
