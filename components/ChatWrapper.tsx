"use client";

import { ChevronUp } from "lucide-react";
import Chat from "./Chat";
import { useCallback, useContext, useEffect, useState } from "react";
import { ActiveUserContext } from "context/activeUserContext";
import { IPopulatedChat } from "utils/types";

type ChatWrapperProps = {
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDrawerOpen: boolean;
};

export default function ChatWrapper({
  setIsDrawerOpen,
  isDrawerOpen,
}: ChatWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [lastTextedUsers, setLastTextedUsers] = useState<IPopulatedChat[]>([]);
  const value = useContext(ActiveUserContext);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchLastTextedUsers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/chat/getChats?userId=${value?.activeUserId}`,
        {}
      );

      if (!res.ok) {
        throw new Error(
          `API request failed with status: ${res.status} - ${res.statusText}`
        );
      }

      const data = await res.json();

      if (data.status === "ok") {
        setLastTextedUsers(
          data.chats.filter((_: IPopulatedChat) => _.users.length > 1)
        );
        setUnreadChatCount(
          data.chats.filter((_: IPopulatedChat) => _.unreadCount > 0).length
        );
      } else {
        throw new Error(`API error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error fetching last texted users:", error);
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    value && value.activeUserId && fetchLastTextedUsers();
  }, [fetchLastTextedUsers]);

  return (
    <>
      <button
        className="hidden md:flex fixed bottom-0 right-0 shadow-lg bg-white cursor-pointer w-88 !mr-4 justify-between items-center !p-4 rounded-t-lg border-t-2 border-r-2 border-l-2 border-[#1DA1F2]"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Messages</span>
          {lastTextedUsers.length > 0 && unreadChatCount > 0 ? (
            <div className="text-white text-sm h-6 w-6 flex items-center justify-center !p-[1px] !rounded-full bg-[#1DA1F2] ">
              {unreadChatCount}
            </div>
          ) : null}
        </div>
        <span className="text-lg">
          <ChevronUp />
        </span>
      </button>

      <Chat
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        lastTextedUsers={lastTextedUsers}
        setLastTextedUsers={setLastTextedUsers}
        fetchLastTextedUsers={fetchLastTextedUsers}
        loading={loading}
      />
    </>
  );
}
