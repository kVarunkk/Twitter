"use client";

import { ISerealizedUser } from "utils/types";
import { TChatMessage } from "./ChatRoom";
import { useEffect, useRef } from "react";

type MessageCardProps = {
  msg: TChatMessage;
  activeUser: ISerealizedUser | null;
  updateMessageState: (id: string) => void;
};

export default function MessageCard({
  msg,
  activeUser,
  updateMessageState,
}: MessageCardProps) {
  const messageCardRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // this function will be called when the notification card is in view
          msg.isRead === false &&
            msg.sender._id !== activeUser?._id &&
            markAsRead();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    const currentRef = messageCardRef.current;
    if (currentRef) observer.observe(currentRef);

    const markAsRead = async () => {
      try {
        const res = await fetch("/api/chat/message/mark-as-read", {
          method: "POST",
          body: JSON.stringify({
            _id: msg._id,
          }),
        });

        if (!res.ok) {
          throw new Error("Some error occured");
        }

        const data = await res.json();
        updateMessageState(data.message._id);
      } catch (err) {
        console.error("Some error occured while marking notification as read.");
      }
    };

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={messageCardRef}
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
  );
}
