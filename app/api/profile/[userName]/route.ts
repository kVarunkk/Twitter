import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Tweet, User } from "utils/models/File";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    await connectToDatabase();
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

    if (!activeUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Find the user whose profile is being requested
    const profileUser = await User.findOne({ username: userName });

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
      .populate({
        path: "comments",
        populate: {
          path: "postedBy",
          select: "username avatar",
        },
      })
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
