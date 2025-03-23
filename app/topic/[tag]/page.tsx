import Header from "@/components/Header";
import ProfileBody from "@/components/ProfileBody";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import TopicArea from "@/components/TopicArea";

export default async function TagTopic({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  return (
    <div className="App">
      <Sidebar />

      <TopicArea tag={tag} />

      <ScrollToTop />
    </div>
  );
}
