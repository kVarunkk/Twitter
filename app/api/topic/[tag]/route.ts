import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";

import { Tweet, User } from "utils/models/File";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    await connectToDatabase();
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

    if (!activeUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch tweets with the specified tag
    const tweets = await Tweet.find({ tag })
      .populate("postedBy", "username avatar")
      .populate("retweetedFrom", "postedTweetTime")
      .populate({
        path: "comments",
        populate: {
          path: "postedBy",
          select: "username avatar",
        },
      })
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
