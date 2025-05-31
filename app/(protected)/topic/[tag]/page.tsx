import AppLoader from "@/components/AppLoader";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import TopicAreaServer from "@/components/TopicAreaServer";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

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
