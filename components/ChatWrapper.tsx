"use client";

import { ChevronUp } from "lucide-react";
import Chat from "./Chat";

export default function ChatWrapper({ setIsDrawerOpen, isDrawerOpen }) {
  return (
    <>
      <button
        className="hidden md:flex fixed bottom-0 right-0 shadow-lg bg-white cursor-pointer w-88 !mr-4 justify-between items-center !p-4 rounded-t-lg border-t-2 border-r-2 border-l-2 border-[#1DA1F2]"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      >
        <span className="text-lg font-bold">Messages</span>
        <span className="text-lg">
          <ChevronUp />
        </span>
      </button>

      <Chat isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
    </>
  );
}
