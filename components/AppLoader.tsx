"use client";

import { RefObject } from "react";

interface AppLoaderProps {
  size?: "sm" | "md" | "lg"; // Loader sizes
  color?: "blue" | "white" | "black"; // Loader colors
  ref?: RefObject<HTMLDivElement | null>;
}

export default function AppLoader({
  ref,
  size = "md",
  color = "blue",
}: AppLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    blue: "border-[#1DA1F2] border-t-transparent",
    white: "border-white border-t-transparent",
    black: "border-black border-t-transparent",
  };

  return (
    <div ref={ref} className="flex justify-center items-center h-full">
      <div
        className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
    </div>
  );
}
