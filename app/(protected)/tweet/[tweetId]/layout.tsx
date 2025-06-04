// app/(protected)/tweet/[tweetId]/layout.tsx
import { ReactNode } from "react";
import { Metadata } from "next";
import { connectToDatabase } from "lib/mongoose";
import { Tweet } from "utils/models/File";
import { IPopulatedTweet } from "utils/types";

export const dynamic = "force-dynamic"; // ensure SSR on every request

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tweetId: string }>;
}): Promise<Metadata> {
  try {
    const decodedTweetId = decodeURIComponent((await params).tweetId);
    await connectToDatabase();

    const tweet = await Tweet.findOne({ postedTweetTime: decodedTweetId })
      .populate("postedBy", "username avatar")
      .lean();

    if (!tweet) throw new Error("Tweet not found");

    const displayName =
      tweet.isRetweeted && tweet.retweetedByUser
        ? tweet.retweetedByUser
        : (tweet as unknown as IPopulatedTweet).postedBy.username;

    return {
      title: `${displayName} on Twitter Clone`,
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
      description: "This tweet may have been deleted.",
      openGraph: {
        title: "Tweet not found",
        description: "This tweet may have been deleted.",
        images: [],
      },
      twitter: {
        card: "summary",
        title: "Tweet not found",
        description: "This tweet may have been deleted.",
        images: [],
      },
    };
  }
}

export default function TweetLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
