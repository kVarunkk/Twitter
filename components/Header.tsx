"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "../app/globals.css";
import { ArrowLeft } from "lucide-react";

function Header({ title }: { title?: string }) {
  const router = useRouter();

  return (
    <div className=" w-full !p-4 flex items-center gap-2 ">
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
  );
}

export default Header;
