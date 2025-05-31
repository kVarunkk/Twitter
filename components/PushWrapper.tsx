"use client";

import { usePushSubscription } from "hooks/usePushSubscription";

export default function PushWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  usePushSubscription(); // 🔔 only called once for auth users
  return <>{children}</>;
}
