"use client";

import { usePushSubscription } from "hooks/usePushSubscription";
import TweetDialog from "./TweetDialog";

export default function PushWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  usePushSubscription(); // 🔔 only called once for auth users
  return (
    <div className="relative">
      {children}
      <div className="sm:hidden fixed bottom-10 right-5">
        <TweetDialog />
      </div>
    </div>
  );
}
