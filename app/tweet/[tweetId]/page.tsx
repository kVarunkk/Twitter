import Feed from "@/components/Feed";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SingleTweet from "./SingleTweet";
import ScrollToTop from "@/components/ScrollToTop";
import Chat from "@/components/Chat";

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
        <SingleTweet tweetId={tweetId} />
      </div>
      <ScrollToTop />
      {/* <Chat /> */}
    </div>
  );
}
