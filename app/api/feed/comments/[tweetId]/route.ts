import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI, validateToken } from "utils/utils";
const { User, Tweet, Comment } = require("utils/models/File");

// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tweetId: string }> }
) {
  try {
    const { tweetId } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    // Find the tweet by its unique identifier
    const tweet = await Tweet.findOne({ postedTweetTime: tweetId });
    if (!tweet) {
      return NextResponse.json(
        { status: "error", message: "Tweet not found" },
        { status: 404 }
      );
    }

    // Determine the original tweet (if the current tweet is a retweet)
    const originalTweetId = tweet.retweetedFrom || tweet._id;

    // Find the original tweet and populate the comments
    const originalTweet = await Tweet.findById(originalTweetId)
      .populate("postedBy", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "postedBy",
          select: "username avatar",
        },
      });

    if (!originalTweet) {
      return NextResponse.json(
        { status: "error", message: "Original tweet not found" },
        { status: 404 }
      );
    }

    // Return the comments of the original tweet
    return NextResponse.json({
      status: "ok",
      tweet: { comments: originalTweet.comments },
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
