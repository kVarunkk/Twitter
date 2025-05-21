import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

const { User, Tweet, Comment } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    const { userName } = await params;
    const url = new URL(req.url);
    const tweetsToSkip = parseInt(url.searchParams.get("t") || "0"); // Pagination: Number of tweets to skip
    const tweetsLimit = 20; // Pagination: Number of tweets to fetch per request

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const activeUser = validationResponse.user;

    // Find the user whose profile is being requested
    const profileUser = await User.findOne({ username: userName });
    // .populate({
    //   path: "tweets",
    //   options: {
    //     sort: { createdAt: -1 },
    //     skip: tweetsToSkip,
    //     limit: tweetsLimit,
    //   }, // Pagination options
    //   populate: [
    //     { path: "postedBy", select: "username avatar" },
    //     {
    //       path: "comments",
    //       populate: { path: "postedBy", select: "username avatar" },
    //     },
    //   ],
    // });

    if (!profileUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the active user follows the profile user
    const isFollowing = profileUser.followers.includes(activeUser.username);
    const followBtn = isFollowing ? "Following" : "Follow";

    // Fetch tweets
    const tweets = await Tweet.find({
      $or: [
        { postedBy: profileUser._id },
        { retweetedByUser: profileUser.username },
      ],
    })
      .populate("postedBy", "username avatar")
      .populate("retweetedFrom", "postedTweetTime")
      .populate("comments")
      .sort({ createdAt: -1 })
      .skip(tweetsToSkip)
      .limit(tweetsLimit);

    // Add like/retweet status for the active user
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

    // Return the profile data and paginated tweets
    return NextResponse.json({
      status: "ok",
      tweets: tweets,
      followers: profileUser.followers.length,
      followBtn: followBtn,
      activeUser: activeUser.username,
      activeUserId: activeUser._id,
      avatar: profileUser.avatar,
      bio: profileUser.bio,
      banner: profileUser.banner,
      publicKey: profileUser.publicKey,
      id: profileUser._id,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
