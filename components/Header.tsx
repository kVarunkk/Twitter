"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import "../app/globals.css";
import { ArrowLeft } from "lucide-react";

function Header({ title }: { title?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const enablePushNotifications = async () => {
    await Notification.requestPermission();
  };

  return (
    <div className=" w-full !p-4 !py-2 sm:!py-4 flex items-center justify-between border-b ">
      <div className="  flex items-center gap-2  ">
        <button
          onClick={() => {
            router.back();
            router.refresh();
          }} // Navigate back to the previous page
          className="cursor-pointer !p-2 rounded-full hover:bg-gray-200 active:bg-gray-200"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {pathname === "/notifications" &&
        Notification.permission !== "granted" && (
          <button
            className="text-xs sm:text-sm cursor-pointer !p-1 text-gray-600 underline"
            onClick={enablePushNotifications}
          >
            Enable Push Notifications
          </button>
        )}
    </div>
  );
}

export default Header;
