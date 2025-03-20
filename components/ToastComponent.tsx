"use client";

import { toast, ToastOptions } from "react-hot-toast";
import React from "react";
import { X } from "lucide-react"; // Import the X icon from lucide-react

interface ToastProps {
  heading: string;
  message: React.ReactNode; // Accepts string or JSX/HTML content
  type?: "success" | "error" | "info" | "warning";
  position?: ToastOptions["position"]; // Dynamic positioning
}

export const showToast = ({
  heading,
  message,
  type = "success", // Default type is success
  position = "bottom-right", // Default position is bottom-right
}: ToastProps) => {
  const toastOptions: ToastOptions = {
    position,
    duration: 5000, // Increased duration to 5 seconds
    icon: null, // Remove any default icons
    className: `!w-[400px] relative bg-white text-black border-2 ${
      type === "success"
        ? "border-green-300"
        : type === "error"
        ? "border-red-300 "
        : type === "warning"
        ? "border-orange-300 "
        : "border-blue-300 "
    } !shadow-sm  rounded-xl !px-4 !py-3`, // Tailwind classes for styling
  };

  const toastContent = (
    <div className="relative !w-full">
      {/* Close Button */}
      <button
        onClick={() => toast.dismiss()} // Dismiss the toast
        className=" absolute top-[2px] right-[2px]  cursor-pointer text-gray-800"
        aria-label="Close"
      >
        <X strokeWidth={3} size={16} /> {/* Close icon */}
      </button>
      <div className="font-bold mb-1">{heading}</div>
      {/* Message Content */}
      <div>{message}</div>
    </div>
  );

  switch (type) {
    case "success":
      toast.success(toastContent, toastOptions);
      break;
    case "error":
      toast.error(toastContent, toastOptions);
      break;
    case "info":
      toast(toastContent, toastOptions);
      break;
    case "warning":
      toast(toastContent, toastOptions);
      break;
    default:
      toast(toastContent, toastOptions);
  }
};
