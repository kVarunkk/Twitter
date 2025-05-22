import ProfileBody from "./ProfileBody";

import { redirect } from "next/navigation";
import { verifyJwt } from "lib/auth";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { cookies } from "next/headers";
import Error from "./Error";

const { User, Tweet, Comment } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

function serializeObject(obj) {
  return JSON.parse(JSON.stringify(obj)); // removes prototypes, ObjectIds, Dates
}

export const dynamic = "force-dynamic";

export default async function ProfileBodyServer({ userName }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/");

    const decoded = await verifyJwt(token);
    if (!decoded) redirect("/");

    const user = await User.findById(decoded.id);
    if (!user) redirect("/");

    const profileUser = await User.findOne({ username: userName });

    const isFollowing = profileUser.followers.includes(user.username);
    const followBtn = isFollowing ? "Following" : "Follow";

    // Fetch tweets
    const tweets = await Tweet.find({
      $or: [
        { retweetedByUser: profileUser.username },
        {
          postedBy: profileUser._id,
          $or: [
            { retweetedByUser: profileUser.username },
            { retweetedByUser: { $exists: false } },
            { retweetedByUser: null },
          ],
        },
      ],
      postedBy: { $exists: true, $ne: null },
    })
      .lean()
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
      .limit(20);
    // Add like/retweet status for the active user
    const hydratedTweets = tweets.map((tweet: any) => {
      const safeTweet = serializeObject(tweet);
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
          likeCommentBtn: comment.likes.includes(user.username)
            ? "deeppink"
            : "black",
        })),
      };
    });

    return (
      <ProfileBody
        userName={userName}
        profileData={{
          initialTweets: hydratedTweets,
          activeUserProp: user.username,
          userIdProp: user._id.toString(),
          followBtnProp: followBtn,
          bioProp: profileUser.bio,
          avatarProp: profileUser.avatar,
          followersProp: profileUser.followers.length,
          bannerProp: profileUser.banner,
        }}
      />
    );
  } catch (error) {
    return <Error />;
  }
}
