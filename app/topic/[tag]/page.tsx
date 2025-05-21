import Chat from "@/components/Chat";
import Header from "@/components/Header";
import ProfileBody from "@/components/ProfileBody";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import TopicArea from "@/components/TopicArea";
import TopicAreaServer from "@/components/TopicAreaServer";

export default async function TagTopic({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <div className="App">
      <Sidebar />

      <TopicAreaServer tag={tag} />

      <ScrollToTop />
      {/* <Chat /> */}
    </div>
  );
}
