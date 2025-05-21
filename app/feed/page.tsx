import Feed from "@/components/Feed";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Chat from "@/components/Chat";
import FeedServer from "@/components/FeedServer";

export default function FeedPage() {
  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Feed" />
        <FeedServer />
        {/* <Chat /> */}
      </div>
    </div>
  );
}
