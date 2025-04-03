import Feed from "@/components/Feed";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Chat from "@/components/Chat";

export default function FeedPage() {
  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Feed" />
        <Feed />
        {/* <Chat /> */}
      </div>
    </div>
  );
}
