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

    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) throw new Error("Some error occured");

    const decoded = await verifyJwt(token);
    if (!decoded) throw new Error("Some error occured");

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

    if (tweet) {
      return {
        title: `${
          tweet.isRetweeted ? tweet.retweetedByUser : tweet.postedBy.username
        } on Twitter Clone: "${tweet.content}"`,
        description: tweet.content ? tweet.content.slice(0, 160) : "",
        openGraph: {
          title: `${
            tweet.isRetweeted ? tweet.retweetedByUser : tweet.postedBy.username
          } on Twitter Clone`,
          description: tweet.content,
          images: tweet.image ? [{ url: tweet.image }] : [],
          type: "article",
        },
        twitter: {
          card: tweet.image ? "summary_large_image" : "summary",
          title: `${
            tweet.isRetweeted ? tweet.retweetedByUser : tweet.postedBy.username
          } on Twitter Clone`,
          description: tweet.content,
          images: tweet.image ? [tweet.image] : [],
        },
      };
    } else throw new Error("tweet not found");
  } catch (error) {
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
