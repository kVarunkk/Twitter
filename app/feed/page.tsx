import Feed from "@/components/Feed";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function FeedPage() {
  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Feed" />
        <Feed />
      </div>
    </div>
  );
}
