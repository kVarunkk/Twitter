import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { IPopulatedTweet } from "utils/types";

import { Tweet, User } from "utils/models/File";

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

    const user = validationResponse.user;

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Find the tweet by its unique identifier
    const tweet = await Tweet.findOne({
      postedTweetTime: tweetId,
    })
      .populate("postedBy", "username avatar")
      .populate("retweetedFrom", "postedTweetTime")
      .populate({
        path: "comments",
        populate: {
          path: "postedBy",
          select: "username avatar",
        },
      })
      .lean<IPopulatedTweet>();

    if (!tweet) throw new Error("Tweet not found");

    tweet.likeTweetBtn = tweet.likes.includes(user.username)
      ? "deeppink"
      : "black";
    tweet.retweetBtn = tweet.retweets.includes(user.username)
      ? "green"
      : "black";
    tweet.comments.forEach((comment) => {
      if (comment.likes) {
        comment.likeCommentBtn = comment.likes.includes(user.username)
          ? "deeppink"
          : "black";
      }
    });

    if (!tweet) {
      return NextResponse.json(
        { status: "error", message: "Tweet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "ok",
      tweet,
      activeUser: user,
    });
  } catch (err) {
    console.error("Error retrieving tweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
