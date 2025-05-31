import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import FeedServer from "@/components/FeedServer";
import { Suspense } from "react";
import AppLoader from "@/components/AppLoader";
import NotificationServer from "@/components/NotificationServer";

export const dynamic = "force-dynamic";

export default function NotificationPage() {
  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Notifications" />
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full">
              <AppLoader size="md" color="blue" />
            </div>
          }
        >
          <NotificationServer />
        </Suspense>
      </div>
    </div>
  );
}
