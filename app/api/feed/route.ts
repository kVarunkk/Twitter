import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI, serializeObject } from "utils/utils";
import { validateToken } from "lib/auth";

import moment from "moment";
import { connectToDatabase } from "lib/mongoose";
import { IPopulatedTweet, ITweet } from "utils/types";
import { Tweet, User } from "utils/models/File";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const tweetsToSkip = parseInt(searchParams.get("t") || "") || 0;

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
    // Fetch tweets
    const tweets = await Tweet.find({
      postedBy: { $exists: true, $ne: null },
    })
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
      .limit(20)
      .lean<IPopulatedTweet[]>();

    const hydratedTweets = tweets.map((tweet) => {
      const safeTweet: IPopulatedTweet = serializeObject(tweet);

      return {
        ...safeTweet,
        likeTweetBtn: safeTweet.likes.includes(user.username)
          ? "deeppink"
          : "black",
        retweetBtn: safeTweet.retweets.includes(user.username)
          ? "green"
          : "black",
        comments: (safeTweet.comments || []).map((comment) => ({
          ...comment,
          likeCommentBtn: (comment.likes || []).includes(user.username)
            ? "deeppink"
            : "black",
        })),
      };
    });

    return NextResponse.json({
      status: "ok",
      tweets: hydratedTweets,
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

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
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

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

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
