import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Tweet } from "utils/models/File";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tweetId: string }> }
) {
  try {
    await connectToDatabase();
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
