"use client";

import { useRouter } from "next/navigation";
import { AiOutlineRetweet } from "react-icons/ai";
import { formatContentWithLinks } from "utils/utils";
import AppLoader from "./AppLoader";
import Avatar from "./Avatar";

export default function TweetBody(props) {
  const router = useRouter();
  return (
    <li className=" flex flex-col ">
      {props.body.isRetweeted && (
        <button
          type="button"
          className="stop-link  flex items-center hover:underline hover:underline-offset-2 hover:decoration-gray-500 gap-1 !mb-2"
        >
          <AiOutlineRetweet className="text-gray-500 mr-2" />
          <span className="text-gray-500 text-sm font-semibold">Retweeted</span>
        </button>
      )}

      <div className="flex items-center mb-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/profile/${props.body.postedBy.username}`);
          }}
          className="stop-link cursor-pointer shrink-0"
        >
          <Avatar
            // className="w-16 h-16 rounded-full !p-2"
            src={`${props.body.postedBy.avatar}`}
            alt="Avatar"
            size="md"
          />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/profile/${props.body.postedBy.username}`);
          }}
          className="stop-link cursor-pointer !p-2 group"
        >
          <div className="flex flex-col items-start">
            <div className="font-bold text-gray-800 group-hover:underline">
              {props.body.postedBy.username}
            </div>
            <div className="text-sm text-gray-500 text-start">
              {props.body.postedTweetTime}
              {props.isEdited && <span className="ml-1 italic">(edited)</span>}
            </div>
          </div>
        </button>
      </div>

      <div className="text-gray-800 !mb-3 break-words whitespace-pre-wrap">
        {formatContentWithLinks(props.body.content)}
      </div>
      {props.body.image && (
        <div
          className={`relative w-full ${
            props.isImageLoading ? "h-64" : ""
          } border border-border rounded-md !mb-3 flex items-center justify-center bg-gray-100`}
          style={!props.isImageLoading ? { height: "auto" } : {}}
          id={`image-container-${props.tweetId}`} // Add a unique ID for the container
        >
          {/* Loader */}
          {props.isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AppLoader />
            </div>
          )}

          {/* Image */}
          <img
            className={`w-full rounded-md ${
              props.isImageLoading ? "hidden" : "block"
            }`} // Hide the image while loading
            src={props.body.image}
            alt="Image"
            onLoad={() => {
              props.setIsImageLoading(false); // Hide loader when image loads
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none"; // Hide the image if it fails to load
              props.setIsImageLoading(false); // Hide the loader if the image fails to load

              // Set the parent container's height to 0
              const container = document.getElementById(
                `image-container-${props.tweetId}`
              );
              if (container) {
                container.style.height = "0";
                container.style.padding = "0"; // Optional: Remove padding if needed
                container.style.border = "none"; // Optional: Remove border if needed
              }
            }}
          />
        </div>
      )}
      {props.body.tag && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/topic/${props.body.tag}`);
          }}
          className="stop-link !px-2 !py-1 rounded-lg !mt-3 text-sm border border-border cursor-pointer  w-fit flex-1 shrink-0  focus-visible:z-10 hover:bg-[#1DA1F2] hover:text-white"
        >
          {props.body.tag}
        </button>
      )}
    </li>
  );
}
