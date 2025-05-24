"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { useSocket } from "../hooks/useSocket";
import { Info, SendHorizonal } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { formatContentWithLinks } from "utils/utils";
import { UrlContext } from "context/urlContext";
import {
  encryptAndSendMessage,
  fetchAndDecryptMessage,
} from "../utils/cryptoHelpers";
import AppLoader from "./AppLoader";
import Link from "next/link";
import Avatar from "./Avatar";
import {
  IPopulatedChat,
  IPopulatedMessage,
  ISerealizedUser,
  IUser,
} from "utils/types";

type ChatRoomProps = {
  activeChat: IPopulatedChat;
  activeUser: ISerealizedUser | null;
};

type Message = {
  _id: string;
  sender: {
    _id: string;
  };
  createdAt: Date;
  content: string;
};

export default function ChatRoom({ activeChat, activeUser }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { socket, joinRoom } = useSocket();
  const textareaRef = useRef(null);
  const url = useContext(UrlContext);
  const [nonActiveUser, setNonActiveUser] = useState<ISerealizedUser>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeChat && activeUser) {
      setNonActiveUser(activeChat.users.find((u) => u._id !== activeUser._id));
    }
  }, [activeChat, activeUser]);

  useEffect(() => {
    if (!socket || !activeChat._id || !activeUser) return; // Ensure socket is initialized
    setLoading(true);
    const fetchMessages = async () => {
      try {
        joinRoom(activeChat._id);

        const res = await fetch(
          `/api/chat/getMessages?chatId=${activeChat._id}`,
          {
            method: "GET",
            // headers: { //"x-access-token": localStorage.getItem("token") || "" },
          }
        );

        if (!res.ok) {
          throw new Error(
            `API request failed with status: ${res.status} - ${res.statusText}`
          );
        }

        const data = await res.json();

        if (data.status === "ok") {
          //console.log(data.messages);

          const decryptedMessages: Message[] = await Promise.all(
            data.messages.map(async (msg: IPopulatedMessage) => ({
              _id: msg._id,
              sender: msg.sender,
              createdAt: new Date(msg.createdAt || ""),
              content: await fetchAndDecryptMessage(
                msg.encryptedAESKeyForSender,
                msg.encryptedAESKeyForRecipient,
                msg.encryptedMessage,
                msg.iv,
                msg.sender._id === activeUser._id
              ),
            }))
          );

          setMessages(decryptedMessages);
        } else {
          throw new Error(`API error: ${data.message}`);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const handleMessage = async (message: any) => {
      const decryptedText = await fetchAndDecryptMessage(
        message.encryptedAESKeyForSender,
        message.encryptedAESKeyForRecipient,
        message.encryptedMessage,
        message.iv,
        message.sender === activeUser._id
      );

      setMessages((prev) => [
        ...prev,
        {
          _id: message.id,
          sender: { _id: message.sender },
          content: decryptedText,
          // todo: fix this
          createdAt: new Date(Date.now()),
        },
      ]);
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket, activeChat._id, setMessages, activeUser]);

  const sendMessage = async () => {
    if (
      socket &&
      newMessage.trim() &&
      nonActiveUser &&
      nonActiveUser?.publicKey &&
      activeUser
    ) {
      try {
        const encryptedData = await encryptAndSendMessage(
          newMessage,
          activeUser.publicKey,
          nonActiveUser.publicKey
        );

        const message = {
          id: uuidv4(),
          roomId: activeChat._id,
          sender: activeUser._id,
          ...encryptedData, // Send encrypted message data
        };

        socket.emit("message", message);
        setNewMessage("");

        await fetch("/api/chat/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //"x-access-token": localStorage.getItem("token"),
          },
          body: JSON.stringify(message),
        });
      } catch (error) {
        console.error("Error encrypting or sending message:", error);
      }
    }
  };

  return (
    <div className="!p-4 !pb-20 relative h-full overflow-y-scroll">
      <Link
        href={`${url}/profile/${nonActiveUser?.username}`}
        className="flex flex-col items-center gap-3 group"
      >
        <Avatar
          // className="!w-18 !h-18 profile-avatar"
          src={`${nonActiveUser?.avatar}`}
          alt="Avatar"
          size="lg"
        />
        <div className="flex flex-col gap-1 items-center text-center">
          <div className="text-xl font-semibold group-hover:underline">
            {nonActiveUser?.username}
          </div>
          <div className="text-sm text-gray-500">
            {formatContentWithLinks(nonActiveUser?.bio || "")}
          </div>
          <div className="text-sm text-gray-500">
            {nonActiveUser?.followers?.length} followers
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={15} /> <div>Your chat is end to end encrypted</div>
          </div>
        </div>
      </Link>
      <div className="!mt-10 !space-y-2">
        {loading ? (
          <div className="!mt-20 text-center ">
            <AppLoader />
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg._id}
              className={`flex flex-col gap-1 !max-w-[75%] !w-fit ${
                msg.sender._id === activeUser?._id
                  ? " self-end !ml-auto"
                  : " self-start"
              }`}
            >
              <div
                className={` !px-4 !py-2 rounded-xl ${
                  msg.sender._id === activeUser?._id
                    ? "bg-[#1DA1F2] text-white "
                    : "bg-gray-200 text-black "
                }`}
              >
                {msg.content}
              </div>
              <div className="text-gray-500 text-xs">
                {msg.createdAt.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-2 !px-4 !py-2 bg-white !shadow-lg">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 !p-2 border border-border rounded-xl resize-none overflow-y-auto"
          rows={1}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="cursor-pointer text- !p-2">
          <SendHorizonal />
        </button>
      </div>
    </div>
  );
}
