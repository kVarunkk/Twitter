import SingleTweet from "@/app/(protected)/tweet/[tweetId]/SingleTweet";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "lib/auth";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import Error from "./Error";
import { Tweet, User } from "utils/models/File";
import { IPopulatedTweet } from "utils/types";
import { connectToDatabase } from "lib/mongoose";
import { Suspense } from "react";
import AppLoader from "./AppLoader";

function serializeObject(obj: unknown) {
  return JSON.parse(JSON.stringify(obj)); // removes prototypes, ObjectIds, Dates
}

export const dynamic = "force-dynamic";
export default async function SingleTweetServer({
  tweetId,
}: {
  tweetId: string;
}) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/");

    const decoded = await verifyJwt(token);
    if (!decoded) redirect("/");

    const user = await User.findById(decoded.id);
    if (!user) redirect("/");

    const decodedTweetId = decodeURIComponent(tweetId);

    const tweet = await Tweet.findOne({ postedTweetTime: decodedTweetId })
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

    const safeTweet: IPopulatedTweet = serializeObject(tweet);

    safeTweet.likeTweetBtn = safeTweet.likes.includes(user.username)
      ? "deeppink"
      : "black";
    safeTweet.retweetBtn = safeTweet.retweets.includes(user.username)
      ? "green"
      : "black";
    safeTweet.comments.forEach((comment) => {
      if (comment.likes) {
        comment.likeCommentBtn = comment.likes.includes(user.username)
          ? "deeppink"
          : "black";
      }
    });

    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen w-full ">
            <AppLoader size="md" color="blue" />
          </div>
        }
      >
        <SingleTweet tweetProp={safeTweet} activeUserProp={user.username} />;
      </Suspense>
    );
  } catch (error) {
    return <Error />;
  }
}
