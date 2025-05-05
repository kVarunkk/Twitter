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
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const url = new URL(req.url);
    const tweetsToSkip = parseInt(url.searchParams.get("t") || "0");

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const activeUser = validationResponse.user;

    // Fetch tweets with the specified tag
    const tweets = await Tweet.find({ isRetweeted: false, tag })
      .populate("postedBy")
      .populate("comments")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(20);

    // Add like/retweet/comment status for the active user
    tweets.forEach((tweet: any) => {
      tweet.likeTweetBtn = tweet.likes.includes(activeUser.username)
        ? "deeppink"
        : "black";
      tweet.retweetBtn = tweet.retweets.includes(activeUser.username)
        ? "green"
        : "black";

      tweet.comments.forEach((comment: any) => {
        comment.likeCommentBtn = comment.likes.includes(activeUser.username)
          ? "deeppink"
          : "black";
      });
    });

    return NextResponse.json({
      status: "ok",
      tweets,
      activeUser,
    });
  } catch (err) {
    console.error("Error fetching topic tweets:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
