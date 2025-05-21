import Chat from "@/components/Chat";
import Header from "@/components/Header";
import ProfileBody from "@/components/ProfileBody";
import ProfileBodyServer from "@/components/ProfileBodyServer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";

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
        {username && <ProfileBodyServer userName={username} />}
      </div>
      <ScrollToTop />
      {/* <Chat /> */}
    </div>
  );
}
