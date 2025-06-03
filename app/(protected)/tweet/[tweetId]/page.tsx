import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import SingleTweetServer from "@/components/SingleTweetServer";
import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { connectToDatabase } from "lib/mongoose";
import { verifyJwt } from "lib/auth";
import { Tweet } from "utils/models/File";
import { IPopulatedTweet } from "utils/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tweetId: string }>;
}): Promise<Metadata> {
  try {
    const { tweetId } = await params;
    const decodedTweetId = decodeURIComponent(tweetId);

    await connectToDatabase();
    const tweet = await Tweet.findOne({ postedTweetTime: decodedTweetId })
      .populate("postedBy", "username avatar")
      .populate("retweetedFrom", "postedTweetTime")
      .lean();

    if (!tweet) throw new Error("Tweet not found");

    const displayName = tweet.isRetweeted
      ? tweet.retweetedByUser
      : (tweet as unknown as IPopulatedTweet).postedBy.username;

    return {
      title: `${displayName} on Twitter Clone: ${tweet.content}`,
      description: tweet.content?.slice(0, 160) || "",
      openGraph: {
        title: `${displayName} on Twitter Clone`,
        description: tweet.content,
        images: tweet.image ? [{ url: tweet.image }] : [],
        type: "article",
      },
      twitter: {
        card: tweet.image ? "summary_large_image" : "summary",
        title: `${displayName} on Twitter Clone`,
        description: tweet.content,
        images: tweet.image ? [tweet.image] : [],
      },
    };
  } catch {
    return {
      title: "Tweet not found",
      description: "This tweet may have been deleted or is not available.",
      openGraph: {
        title: "Tweet not found",
        description: "This tweet may have been deleted or is not available.",
        images: [],
      },
      twitter: {
        card: "summary",
        title: "Tweet not found",
        description: "This tweet may have been deleted or is not available.",
        images: [],
      },
    };
  }
}

export default async function TweetPage({
  params,
}: {
  params: Promise<{ tweetId: string }>;
}) {
  const { tweetId } = await params;

  return (
    <div className="HeaderAndFeed">
      <Header title="Tweet" />
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen w-full">
            <AppLoader size="md" color="blue" />
          </div>
        }
      >
        <SingleTweetServer tweetId={tweetId} />
      </Suspense>
    </div>
  );
}
