import Feed from "@/components/Feed";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SingleTweet from "./SingleTweet";
import ScrollToTop from "@/components/ScrollToTop";
import Chat from "@/components/Chat";
import SingleTweetServer from "@/components/SingleTweetServer";
import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { tweetId: string };
}): Promise<Metadata> {
  try {
    const BASE_URL =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://varuns-twitter-clone.vercel.app";
    const res = await fetch(`${BASE_URL}/api/tweet/${params.tweetId}`, {
      next: { revalidate: 60 }, // cache for OG crawlers
    });

    if (!res.ok) throw new Error("Tweet not found");

    const data = await res.json();

    return {
      title: `${data.tweet.postedBy.username} on Twitter Clone: "${data.tweet.content}"`,
      description: data.tweet.content.slice(0, 160),
      openGraph: {
        title: `${data.tweet.postedBy.username} on Twitter Clone`,
        description: data.tweet.content,
        images: data.tweet.image ? [{ url: data.tweet.image }] : [],
        type: "article",
      },
      twitter: {
        card: data.tweet.image ? "summary_large_image" : "summary",
        title: `${data.tweet.postedBy.username} on Twitter Clone`,
        description: data.tweet.content,
        images: data.tweet.image ? [data.tweet.image] : [],
      },
    };
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
    <div className="App">
      <Sidebar />
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
      <ScrollToTop />
      {/* <Chat /> */}
    </div>
  );
}
