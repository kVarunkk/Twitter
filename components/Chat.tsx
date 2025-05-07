"use client";

import { useContext, useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "./components/ui/drawer";
import ChatRoom from "./ChatRoom";
import SearchDialog from "./SearchDialog";
import { ArrowLeft, ChevronUp, Plus, X } from "lucide-react";
import Link from "next/link";
import jwtDecode from "jwt-decode";
import { showToast } from "./ToastComponent";
import { UrlContext } from "context/urlContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { BsThreeDots } from "react-icons/bs";
import { RiDeleteBin6Fill } from "react-icons/ri";
import AppLoader from "./AppLoader";
import { useAuth } from "hooks/useAuth";
import Avatar from "./Avatar";

export default function Chat(props) {
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [lastTextedUsers, setLastTextedUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const url = useContext(UrlContext);

  const { user, loading: load } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(`${url}/api/profile/${(user as any).username}`, {
        headers: {
          //"x-access-token": localStorage.getItem("token") || "",
        },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setActiveUser(data);
      } else {
        console.error("Error fetching user profile");
      }
    };
    if (!load && user) {
      fetchUser();
    }
  }, [user, load]);

  useEffect(() => {
    const fetchLastTextedUsers = async () => {
      if (!activeUser) return;

      setLoading(true);

      try {
        const res = await fetch(`/api/chat/getChats?userId=${activeUser.id}`, {
          headers: {
            //"x-access-token": localStorage.getItem("token") || "",
          },
        });

        if (!res.ok) {
          throw new Error(
            `API request failed with status: ${res.status} - ${res.statusText}`
          );
        }

        const data = await res.json();

        if (data.status === "ok") {
          setLastTextedUsers(data.chats.filter((_) => _.users.length > 1));
        } else {
          throw new Error(`API error: ${data.message}`);
        }
      } catch (error) {
        console.error("Error fetching last texted users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastTextedUsers();
  }, [activeUser]);

  const handleUserSelect = async (user) => {
    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"x-access-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ user1: activeUser.id, user2: user._id }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        //console.log(data.chat);
        setActiveChat(data.chat);
        setIsDialogOpen(false);
      } else {
        throw new Error(data.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      showToast({
        heading: "Error",
        message: "Failed to create chat",
        type: "error",
      });
    }
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const req = await fetch(`${url}/api/chat/delete?chatId=${chatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        // todo: fix delete logic
        // setLastTextedUsers((users) =>
        //   users.filter((user) => user.postedTweetTime !== tweetId)
        // );

        showToast({
          heading: "Success 🎉",
          message: "Chat deleted successfully.",
          type: "success",
        });
      } else {
        console.error("Error deleting Chat:", data.message);
        showToast({
          heading: "Error",
          message: data.message || "Failed to delete Chat.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting Chat:", error);
      showToast({
        heading: "Error",
        message: "Failed to delete Chat.",
        type: "error",
      });
    }
  };

  // Utility function to wrap event handlers
  const stopPropagation = (handler?) => (e) => {
    e.stopPropagation(); // Prevent event propagation
    if (handler) {
      handler(e); // Call the original handler
    }
  };

  return (
    <div className="fixed bottom-0 right-0">
      <Drawer open={props.isDrawerOpen} onOpenChange={props.setIsDrawerOpen}>
        <DrawerContent className="md:w-88 h-full md:h-[70vh] md:!mr-4 !ml-auto !border-2 !border-b-0 !border-[#1DA1F2]">
          <div className="flex justify-between items-center !px-4 !py-2 border-b">
            <div className="flex items-center gap-2 truncate">
              {activeChat && (
                <button
                  onClick={() => setActiveChat(null)}
                  className="!p-2 cursor-pointer"
                >
                  <ArrowLeft />
                </button>
              )}
              <DrawerTitle className="text-lg truncate">
                {activeChat ? (
                  <Link
                    href={`/profile/${
                      activeChat.users.find((u) => u._id !== activeUser.id)
                        .username
                    }`}
                    className="hover:underline underline-offset-2"
                  >
                    {
                      activeChat.users.find((u) => u._id !== activeUser.id)
                        .username
                    }
                  </Link>
                ) : (
                  "Messages"
                )}
              </DrawerTitle>
            </div>
            <div className="flex gap-2">
              <button
                className="!p-2 cursor-pointer hover:bg-gray-100 !border !border-border !rounded-full"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus />
              </button>
              <button
                className="!p-2 cursor-pointer hover:bg-gray-100 !border !border-border !rounded-full"
                onClick={() => props.setIsDrawerOpen(false)}
              >
                <X />
              </button>
            </div>
          </div>

          {activeChat ? (
            <ChatRoom activeChat={activeChat} activeUser={activeUser} />
          ) : (
            <div className="overflow-y-auto h-full">
              {lastTextedUsers.length > 0 ? (
                lastTextedUsers.map((chat) => (
                  <button
                    key={chat._id}
                    className="relative hover:bg-gray-100 !w-full  !p-4 !border-b cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveChat(chat)}
                  >
                    <Avatar
                      // className="!h-13 !w-13 profile-avatar"
                      src={`${
                        chat.users.find((u) => u._id !== activeUser.id).avatar
                      }`}
                      alt="Avatar"
                    />
                    <div className="flex flex-col gap-1 items-start">
                      <div className="font-semibold">
                        {" "}
                        {
                          chat.users.find((u) => u._id !== activeUser.id)
                            .username
                        }
                      </div>
                      <div className="text-gray-500 truncate">
                        {chat.lastMessage && chat.lastMessage.content}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="absolute top-6 right-3"
                        onClick={stopPropagation()}
                        asChild
                      >
                        <button
                          onClick={stopPropagation()}
                          className="cursor-pointer !p-2 !ml-auto text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full"
                        >
                          <BsThreeDots />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="text-lg">
                        <DropdownMenuItem onClick={stopPropagation()}>
                          <form onSubmit={(e) => deleteChat(e, chat._id)}>
                            <button
                              disabled
                              onClick={stopPropagation()}
                              className="!p-2 flex items-center"
                            >
                              <RiDeleteBin6Fill className="!mr-2" /> Delete
                            </button>
                          </form>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))
              ) : loading ? (
                <div className="text-center  !mt-20">
                  <AppLoader />
                </div>
              ) : (
                <p className="text-center text-gray-500 !mt-20">
                  No recent chats
                </p>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <SearchDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUserSelect={handleUserSelect}
        activeUser={activeUser}
      />
    </div>
  );
}
