import AppLoader from "@/components/AppLoader";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import ProfileBody from "@/components/ProfileBody";
import ProfileBodyServer from "@/components/ProfileBodyServer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import { Suspense } from "react";

export default async function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <div className="App">
      <Sidebar />
      <div className="HeaderAndFeed">
        <Header title="Profile" />
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen w-full">
              <AppLoader size="md" color="blue" />
            </div>
          }
        >
          <ProfileBodyServer userName={username} />
        </Suspense>
      </div>
      <ScrollToTop />
    </div>
  );
}
