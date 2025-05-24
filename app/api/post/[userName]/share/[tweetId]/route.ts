import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

    // Increment the shares field
    tweet.shares = (tweet.shares || 0) + 1;

    // Save the updated tweet
    await tweet.save();

    // Return the updated share count
    return NextResponse.json({
      status: "ok",
      shareCount: tweet.shares,
    });
  } catch (err) {
    console.error("Error sharing tweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
