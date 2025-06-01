import Sidebar from "@/components/Sidebar";
import PushWrapper from "../../components/PushWrapper";
import TweetDialog from "@/components/TweetDialog";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PushWrapper>
      <div className="App">
        <Sidebar />
        {children}
      </div>
    </PushWrapper>
  );
}
