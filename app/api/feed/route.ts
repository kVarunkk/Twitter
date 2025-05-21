import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

import moment from "moment";
const { User, Tweet, Comment } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tweetsToSkip = parseInt(searchParams.get("t")) || 0;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    // Fetch tweets
    const tweets = await Tweet.find()
      .populate("postedBy", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "postedBy",
          select: "username avatar",
        },
      })
      .populate("retweetedFrom", "postedTweetTime")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(20);

    // Add like and retweet button states
    tweets.forEach((tweet) => {
      tweet.likeTweetBtn = tweet.likes.includes(user.username)
        ? "deeppink"
        : "black";
      tweet.retweetBtn = tweet.retweets.includes(user.username)
        ? "green"
        : "black";
      tweet.comments.forEach((comment) => {
        comment.likeCommentBtn = comment.likes.includes(user.username)
          ? "deeppink"
          : "black";
      });
    });

    return NextResponse.json({
      status: "ok",
      tweets: tweets.filter((_) => _.postedBy),
      activeUser: user.username,
      activeUserId: user._id,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tweetInfo = body.tweet;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    // Create a new tweet
    const newTweet = await Tweet.create({
      content: tweetInfo.content,
      retweets: [],
      tag: tweetInfo.tag,
      postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
      image: body.image || null,
      // imageId: body.imageId,
    });

    // Find the user who posted the tweet
    const dbUser = await User.findOne({ username: user.username });
    if (!dbUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Associate the tweet with the user
    newTweet.postedBy = dbUser._id;
    await newTweet.save();

    dbUser.tweets.unshift(newTweet._id);
    await dbUser.save();

    return NextResponse.json({ status: "ok", tweet: newTweet });
  } catch (err) {
    console.error("Error composing tweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
