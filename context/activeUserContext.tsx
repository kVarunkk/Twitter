"use client";

import { createContext, useState, useEffect } from "react";

type TActiveUserContext = {
  activeUser: string;
  activeUserId: string;
  unreadNotificationCount: number;
  setActiveUserId: (id: string) => void;
  setUnreadNotificationCount: (count: number) => void;
};

export const ActiveUserContext = createContext<TActiveUserContext | null>(null);

export const ActiveUserContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeUserId, setActiveUserId] = useState("");
  const [activeUser, setActiveUser] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    const getUnreadNotifs = async () => {
      try {
        const res = await fetch("/api/notification/unread");
        if (!res.ok) throw new Error("Could not fetch Notification count");
        const data = await res.json();

        setActiveUserId(data.activeUserId);
        setActiveUser(data.activeUser);
        setUnreadNotificationCount(data.notifications);
      } catch (err) {
        console.error("Failed to fetch notification count");
      }
    };

    getUnreadNotifs();
  }, []);

  return (
    <ActiveUserContext.Provider
      value={{
        activeUserId,
        activeUser,
        unreadNotificationCount,
        setActiveUserId,
        setUnreadNotificationCount,
      }}
    >
      {children}
    </ActiveUserContext.Provider>
  );
};
