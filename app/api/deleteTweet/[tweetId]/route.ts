import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Tweet } from "utils/models/File";

// Ensure Mongoose connection is established

export async function POST(
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

    // Check if the authenticated user is the owner of the tweet
    if (tweet.postedBy.toString() !== user.id) {
      return NextResponse.json(
        {
          status: "error",
          message: "Unauthorized to delete this tweet",
        },
        { status: 403 }
      );
    }

    // Delete the tweet & retweets associated with this tweet
    await Tweet.deleteMany({
      $or: [{ retweetedFrom: tweet._id }, { _id: tweet._id }],
    });

    if (tweet.isRetweeted && tweet.retweetedFrom) {
      await Tweet.updateMany(
        {
          $or: [
            { _id: tweet.retweetedFrom },
            { retweetedFrom: tweet.retweetedFrom },
          ],
        },
        { $pull: { retweets: user.username } }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Tweet deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting tweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
