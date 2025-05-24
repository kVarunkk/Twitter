import { cookies } from "next/headers";
import Feed from "./Feed";
import { redirect } from "next/navigation";
import { verifyJwt } from "lib/auth";
import mongoose from "mongoose";
import { MONGODB_URI, serializeObject } from "utils/utils";
import Error from "./Error";
import { connectToDatabase } from "lib/mongoose";
import { Tweet, User } from "utils/models/File";
import { IPopulatedTweet, ITweet } from "utils/types";

export const dynamic = "force-dynamic"; // This will make sure the page is always revalidated on every request

export default async function FeedServer() {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/");

    const decoded = await verifyJwt(token);
    if (!decoded) redirect("/");

    const user = await User.findById(decoded.id);
    if (!user) redirect("/");

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

    return (
      <Feed
        initialTweets={hydratedTweets}
        activeUserProp={user.username}
        userIdProp={user._id.toString()}
      />
    );
  } catch (error) {
    return <Error />;
  }
}
