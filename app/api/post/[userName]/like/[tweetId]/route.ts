import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Tweet } from "utils/models/File";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userName: string; tweetId: string }> }
) {
  try {
    await connectToDatabase();
    const { userName, tweetId } = await params;

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

    // Check if the user has already liked the tweet
    const userIndex = tweet.likes.indexOf(userName);

    if (userIndex === -1) {
      // User has not liked the tweet, so add the like
      tweet.likes.push(userName);
      tweet.likeTweetBtn = "deeppink";
    } else {
      // User has already liked the tweet, so remove the like
      tweet.likes.splice(userIndex, 1);
      tweet.likeTweetBtn = "black";
    }

    // Save the updated tweet
    await tweet.save();

    // Propagate the like to the original tweet and all its retweets
    const tweetIdToUpdate = tweet.retweetedFrom || tweet._id; // Use original tweet ID if it's a retweet
    await Tweet.updateMany(
      { $or: [{ _id: tweetIdToUpdate }, { retweetedFrom: tweetIdToUpdate }] },
      { likes: tweet.likes }
    );

    // Return the updated like count and button color to the frontend
    return NextResponse.json({
      status: "ok",
      likeCount: tweet.likes.length,
      likeTweetBtn: tweet.likeTweetBtn,
    });
  } catch (err) {
    console.error("Error updating like:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
