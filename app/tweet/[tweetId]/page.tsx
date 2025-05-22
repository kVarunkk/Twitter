import Feed from "@/components/Feed";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SingleTweet from "./SingleTweet";
import ScrollToTop from "@/components/ScrollToTop";
import Chat from "@/components/Chat";
import SingleTweetServer from "@/components/SingleTweetServer";
import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";

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
