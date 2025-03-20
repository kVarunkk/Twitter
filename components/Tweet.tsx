"use client";

import React, { useState, useEffect, useContext } from "react";
import Comment from "./Comment";
import { AiOutlineRetweet, AiOutlineLike } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { GoComment } from "react-icons/go";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { AiFillEdit } from "react-icons/ai";
import moment from "moment";
import { useToast } from "@chakra-ui/toast";
import { UrlContext } from "../context/urlContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import Link from "next/link";
import AppLoader from "./AppLoader";
import { showToast } from "./ToastComponent";
import { useRouter } from "next/navigation";

function Tweet(props) {
  const [likeCount, setLikeCount] = useState(props.body.likes.length);
  const [commentCount, setCommentCount] = useState(props.body.comments.length);
  const [retweetCount, setRetweetCount] = useState(props.body.retweets.length);
  const [retweetBtnColor, setRetweetBtnColor] = useState(props.body.retweetBtn);
  const [btnColor, setBtnColor] = useState(props.body.likeTweetBtn);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleComments, setVisibleComments] = useState(5);
  const [tweetContent, setTweetContent] = useState(props.body.content);
  const [isEdited, setIsEdited] = useState(props.body.isEdited);
  const tweetId = props.body.postedTweetTime;
  const [isImageLoading, setIsImageLoading] = useState(true); // Track image loading state
  const isUserActive = props.body.postedBy?.username === props.user;
  const toast = useToast();
  const url = useContext(UrlContext);
  const router = useRouter();

  const loadMoreComments = (e) => {
    e.stopPropagation();
    if (visibleComments >= comments.length) {
      // Collapse comments back to 5
      setVisibleComments(5);
    } else {
      // Show 5 more comments
      setVisibleComments((prev) => prev + 5);
    }
  };

  // Fetch comments for the tweet
  const populateComments = async () => {
    try {
      const req = await fetch(`${url}/feed/comments/${tweetId}`, {
        headers: {
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok" && data.tweet && data.tweet.comments) {
        setComments(data.tweet.comments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    populateComments();
  }, []);

  // Handle liking a tweet
  const handleLike = async (e) => {
    e.stopPropagation();

    e.preventDefault();
    try {
      const req = await fetch(`${url}/post/${props.user}/like/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        setBtnColor((prev) => (prev === "black" ? "deeppink" : "black"));
        setLikeCount((prev) => (btnColor === "black" ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  // Handle retweeting
  const handleRetweet = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const req = await fetch(`${url}/post/${props.user}/retweet/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        // Update the retweet count and button color dynamically
        setRetweetCount(data.retweetCount);
        setRetweetBtnColor(data.retweetBtn);

        // Remove the tweet if retweetCount is 0, color is black, and the route is /profile
        if (
          props.body.isRetweeted &&
          data.retweetCount === 0 &&
          data.retweetBtn === "black" &&
          window.location.pathname === "/profile/" + props.user
        ) {
          if (props.setTweets) {
            props.setTweets((prevTweets) =>
              prevTweets.filter((tweet) => tweet.postedTweetTime !== tweetId)
            );
          } else {
            router.back();
          }
        }
      }
    } catch (error) {
      console.error("Error retweeting:", error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const comment = {
      content: e.target.commentInput.value,
      postedBy: {
        username: props.user,
      },
    };

    try {
      const req = await fetch(`${url}/feed/comment/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify(comment),
      });

      const data = await req.json();
      if (data.status === "ok") {
        console.log(data.comment);
        // Add the new comment to the state
        setComments((prevComments) => [data.comment, ...prevComments]);
        setCommentCount(data.commentCount);
        e.target.commentInput.value = ""; // Clear input after successful comment
      } else {
        console.error("Failed to post comment:", data.message);
        showToast({
          heading: "Error",
          message: "Failed to post comment.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      showToast({
        heading: "Error",
        message: "Failed to post comment.",
        type: "error",
      });
    }
  };

  // Handle tweet deletion
  const deleteTweet = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const req = await fetch(`${url}/deleteTweet/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        if (props.setTweets) {
          props.setTweets((prevTweets) =>
            prevTweets.filter((tweet) => tweet.postedTweetTime !== tweetId)
          );
        } else {
          router.back();
        }

        showToast({
          heading: "Success 🎉",
          message: "Tweet deleted successfully.",
          type: "success",
        });
      } else {
        console.error("Error deleting tweet:", data.message);
        showToast({
          heading: "Error",
          message: data.message || "Failed to delete tweet.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
      showToast({
        heading: "Error",
        message: "Failed to delete tweet.",
        type: "error",
      });
    }
  };

  // Handle tweet editing
  const editTweet = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const req = await fetch(`${url}/editTweet/${tweetId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ content: tweetContent }),
      });

      const data = await req.json();
      if (data.status === "ok") {
        const updatedTweet = data.tweet;

        if (props.setTweets) {
          props.setTweets((prevTweets) =>
            prevTweets.map((tweet) =>
              tweet._id === updatedTweet._id ? updatedTweet : tweet
            )
          );
        } else {
          // for single tweet page
          props.setTweet(updatedTweet);
        }

        showToast({
          heading: "Success 🎉",
          message: "Tweet edited successfully.",
          type: "success",
        });
      } else {
        console.error("Error editing tweet:", data.message);
        showToast({
          heading: "Error",
          message: data.message || "Failed to edit tweet.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error editing tweet:", error);
      showToast({
        heading: "Error",
        message: "Failed to edit tweet.",
        type: "error",
      });
    }
  };

  // Utility function to wrap event handlers
  const stopPropagation = (handler?) => (e) => {
    console.log("here");
    e.stopPropagation(); // Prevent event propagation
    if (handler) {
      handler(e); // Call the original handler
    }
  };

  return (
    <div className="bg-white    text-lg">
      <div className="relative hover:bg-gray-100 !p-4 border-b border-border">
        <Link href={`/tweet/${tweetId}`}>
          <li className=" flex flex-col ">
            {props.body.isRetweeted && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${props.body.retweetedByUser}`);
                }}
                className="cursor-pointer flex items-center hover:underline hover:underline-offset-2 hover:decoration-gray-500 gap-1 !mb-2"
              >
                <AiOutlineRetweet className="text-gray-500 mr-2" />
                <span className="text-gray-500 text-sm font-semibold">
                  Retweeted
                </span>
              </button>
            )}

            <div className="flex items-center mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${props.body.postedBy.username}`);
                }}
                className="cursor-pointer"
              >
                <img
                  className="w-13 h-13 rounded-full !mr-3"
                  src={`${url}/images/${props.body.postedBy.avatar}`}
                  alt="Avatar"
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${props.body.postedBy.username}`);
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-800">
                    {props.body.postedBy.username}
                  </span>
                  <span className="text-sm text-gray-500">
                    {props.body.postedTweetTime}
                    {isEdited && <span className="ml-1 italic">(edited)</span>}
                  </span>
                </div>
              </button>
            </div>

            <div className="text-gray-800 !mb-3">{props.body.content}</div>
            {props.body.image && (
              <div
                className={`relative w-full ${
                  isImageLoading ? "h-64" : ""
                } border border-border rounded-md !mb-3 flex items-center justify-center bg-gray-100`}
                style={!isImageLoading ? { height: "auto" } : {}}
                id={`image-container-${tweetId}`} // Add a unique ID for the container
              >
                {/* Loader */}
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AppLoader />
                  </div>
                )}

                {/* Image */}
                <img
                  className={`w-full rounded-md ${
                    isImageLoading ? "hidden" : "block"
                  }`} // Hide the image while loading
                  src={props.body.image}
                  alt="Image"
                  onLoad={() => {
                    setIsImageLoading(false); // Hide loader when image loads
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none"; // Hide the image if it fails to load
                    setIsImageLoading(false); // Hide the loader if the image fails to load

                    // Set the parent container's height to 0
                    const container = document.getElementById(
                      `image-container-${tweetId}`
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
                  e.stopPropagation();
                  router.push(`/topic/${props.body.tag}`);
                }}
                className=" !px-2 !py-1 rounded-lg !mt-3 text-sm border border-border cursor-pointer  w-fit flex-1 shrink-0  focus-visible:z-10 hover:bg-[#1DA1F2] hover:text-white"
              >
                {props.body.tag}
              </button>
            )}
          </li>
        </Link>
        {isUserActive && (
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="absolute top-3 right-3"
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
                  <form onSubmit={deleteTweet}>
                    <button
                      onClick={stopPropagation()}
                      className="!p-2 flex items-center"
                    >
                      <RiDeleteBin6Fill className="!mr-2" /> Delete
                    </button>
                  </form>
                </DropdownMenuItem>
                <DialogTrigger
                  onClick={stopPropagation()}
                  className="w-full"
                  asChild
                >
                  <DropdownMenuItem onClick={stopPropagation()} asChild>
                    <button
                      onClick={stopPropagation()}
                      className="!p-2 flex items-center"
                    >
                      <AiFillEdit className="!mr-2" /> Edit
                    </button>
                  </DropdownMenuItem>
                </DialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent className="!p-4">
              <DialogHeader>
                <DialogTitle>Edit Tweet</DialogTitle>
              </DialogHeader>
              <form onSubmit={editTweet}>
                <input
                  type="text"
                  value={tweetContent}
                  onChange={(e) => {
                    e.stopPropagation();
                    setTweetContent(e.target.value);
                  }}
                  className="!w-full !border-b !border-border  !p-2 !mb-4"
                  required
                />
                <button
                  onClick={stopPropagation()}
                  type="submit"
                  className="tweetBtn"
                >
                  Save
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        <div className="flex items-center !mt-3 !space-x-4">
          <button
            className={`cursor-pointer flex items-center gap-1  ${
              btnColor === "deeppink" ? "text-pink-500" : "text-gray-500"
            }`}
            onClick={stopPropagation(handleLike)}
          >
            <AiOutlineLike className="mr-1" />
            <span>{likeCount}</span>
          </button>
          <button
            className={`cursor-pointer flex items-center gap-1  ${
              retweetBtnColor === "green" ? "text-green-500" : "text-gray-500"
            }`}
            onClick={stopPropagation(handleRetweet)}
          >
            <AiOutlineRetweet className="mr-1" />
            <span>{retweetCount}</span>
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()} // Prevents triggering the link
                className="cursor-pointer flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <GoComment className="mr-1" />
                <span>{comments?.length > 0 && comments?.length}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="!p-4">
              <DialogHeader>
                <DialogTitle>
                  Replying to{" "}
                  <Link
                    className="text-[#1DA1F2]"
                    href={`/profile/${props.body.postedBy.username}`}
                  >
                    @{props.body.postedBy.username}
                  </Link>
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCommentSubmit}>
                <input
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                  name="commentInput"
                  placeholder="Tweet your reply"
                  className="!w-full !border-b !border-border !p-2 !mb-4"
                  required
                />
                <button
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                  type="submit"
                  className="tweetBtn"
                >
                  Reply
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex">
        <div className="!w-1/8 !border-r !border-border shrink-0 "></div>
        <div className="w-7/8 shrink-0">
          {loading ? (
            <div className=" !p-4 text-center ">
              <AppLoader size="sm" />
            </div>
          ) : (
            comments.slice(0, visibleComments).map((comment) => {
              comment.likeCommentBtn = comment.likes.includes(props.user)
                ? "deeppink"
                : "black";
              return (
                <Comment
                  key={comment._id}
                  user={props.user}
                  tweetBy={props.body.postedBy.username}
                  body={comment}
                  setComments={setComments}
                  setCommentCount={setCommentCount}
                  populateComments={populateComments}
                  handleCommentSubmit={handleCommentSubmit}
                />
              );
            })
          )}
        </div>
      </div>

      {!loading && comments.length >= 5 && (
        <button
          className="text-sm !p-4 cursor-pointer !mt-2 text-gray-600 hover:underline"
          onClick={loadMoreComments}
        >
          {visibleComments >= comments.length
            ? "Collapse Comments"
            : `${comments.length - visibleComments} More Comments`}
        </button>
      )}
    </div>
  );
}

export default Tweet;
