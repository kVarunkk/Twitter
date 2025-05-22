import AppLoader from "@/components/AppLoader";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import ProfileBody from "@/components/ProfileBody";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import TopicArea from "@/components/TopicArea";
import TopicAreaServer from "@/components/TopicAreaServer";
import { Suspense } from "react";

export default async function TagTopic({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Topics" />
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full ">
              <AppLoader size="md" color="blue" />
            </div>
          }
        >
          <TopicAreaServer tag={tag} />
        </Suspense>
      </div>

      <ScrollToTop />
      {/* <Chat /> */}
    </div>
  );
}
