"use client";

import { Inbox, Mail } from "lucide-react";
import Link from "next/link";
import { IPopulatedNotification } from "utils/types";
import Avatar from "./Avatar";
import { GoComment } from "react-icons/go";
import { AiOutlineLike, AiOutlineRetweet } from "react-icons/ai";
import { useEffect, useRef } from "react";

type NotificationCardProps = {
  updateLoading: React.Dispatch<React.SetStateAction<boolean>>;
  user: string;
  body: IPopulatedNotification;
  setNotifications: React.Dispatch<
    React.SetStateAction<IPopulatedNotification[]>
  >;
  userId: string;
  openChatDrawer: () => void;
  updateNotificationState: (id: string) => void;
};

export default function NotificationCard({
  updateLoading,
  user,
  body,
  setNotifications,
  userId,
  openChatDrawer,
  updateNotificationState,
}: NotificationCardProps) {
  const notifCardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // this function will be called when the notification card is in view
          !body.isRead && markAsRead();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    const currentRef = notifCardRef.current;
    if (currentRef) observer.observe(currentRef);

    const markAsRead = async () => {
      try {
        const res = await fetch("/api/notification/mark-as-read", {
          method: "POST",
          body: JSON.stringify({
            _id: body._id,
          }),
        });

        if (!res.ok) {
          throw new Error("Some error occured");
        }

        const data = await res.json();
        updateNotificationState(data.notification._id);
      } catch (err) {
        console.error("Some error occured while marking notification as read.");
      }
    };

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  if (body.type === "message") {
    return (
      <button
        ref={notifCardRef}
        className={`flex w-full items-center gap-5 cursor-pointer ${
          body.isRead ? "bg-white" : "bg-[#1DA1F2]/12"
        } hover:bg-gray-100 active:bg-gray-100 !p-4 border-b border-border`}
        onClick={(e) => {
          e.stopPropagation();
          openChatDrawer();
        }}
      >
        <Mail size={25} />
        <div>
          <Link
            className="w-fit !mb-4 stop-link"
            onClick={(e) => e.stopPropagation()}
            href={"/profile/" + body.sender.username}
          >
            <Avatar src={`${body.sender.avatar}`} alt="Avatar" size="md" />
          </Link>
          <div>
            <Link
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:underline underline-offset-2"
              href={"/profile/" + body.sender.username}
            >
              {body.sender.username}
            </Link>{" "}
            sent you a message.
          </div>
        </div>
      </button>
    );
  } else
    return (
      <Link
        ref={notifCardRef}
        className={`flex items-center gap-5 ${
          body.isRead ? "bg-white" : "bg-[#1DA1F2]/12"
        } hover:bg-gray-100 active:bg-gray-100 !p-4 border-b border-border`}
        href={"/tweet/" + body.tweet?.postedTweetTime}
      >
        {body.type === "comment" ? (
          <GoComment size={25} />
        ) : body.type === "like" ? (
          <AiOutlineLike size={25} />
        ) : (
          <AiOutlineRetweet size={25} />
        )}
        <div>
          <Link
            className="stop-link w-fit !mb-4"
            href={"/profile/" + body.sender.username}
          >
            <Avatar src={`${body.sender.avatar}`} alt="Avatar" size="md" />
          </Link>
          <div>
            <Link
              className="stop-link font-semibold hover:underline underline-offset-2"
              href={"/profile/" + body.sender.username}
            >
              {body.sender.username}
            </Link>{" "}
            {body.type === "comment"
              ? "replied to your tweet"
              : body.type === "like"
              ? "liked your tweet"
              : "retweeted your tweet"}
          </div>
        </div>
      </Link>
    );
}
