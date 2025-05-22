import Feed from "@/components/Feed";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Chat from "@/components/Chat";
import FeedServer from "@/components/FeedServer";
import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";

export default function FeedPage() {
  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Feed" />
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full">
              <AppLoader size="md" color="blue" />
            </div>
          }
        >
          <FeedServer />
        </Suspense>
      </div>
    </div>
  );
}
