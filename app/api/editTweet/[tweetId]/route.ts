import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Tweet } from "utils/models/File";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tweetId: string }> }
) {
  try {
    await connectToDatabase();
    const { tweetId } = await params;
    const { content } = await req.json();

    // Validate input
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { status: "error", message: "Content cannot be empty" },
        { status: 400 }
      );
    }

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
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

    // Find the original tweet
    const originalTweet = await Tweet.findById(originalTweetId);
    if (!originalTweet) {
      return NextResponse.json(
        { status: "error", message: "Original tweet not found" },
        { status: 404 }
      );
    }

    // Check if the authenticated user is the owner of the original tweet
    if (originalTweet.postedBy.toString() !== user.id) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized to edit this tweet" },
        { status: 403 }
      );
    }

    // Update the original tweet content and mark it as edited
    originalTweet.content = content;
    originalTweet.isEdited = true;
    await originalTweet.save();

    // Propagate the updated content to all retweets of the original tweet
    await Tweet.updateMany(
      { retweetedFrom: originalTweetId },
      { content: originalTweet.content, isEdited: true }
    );

    // Fetch the updated original tweet from the database
    const updatedTweet = await Tweet.findById(originalTweetId).populate(
      "postedBy",
      "username avatar"
    );

    return NextResponse.json({
      status: "ok",
      message: "Tweet updated successfully",
      tweet: updatedTweet,
    });
  } catch (err) {
    console.error("Error editing tweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
