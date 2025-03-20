"use client";

import React, { useState, useContext, useMemo } from "react";
import { AiOutlineLike } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { AiFillEdit } from "react-icons/ai";
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
import { showToast } from "./ToastComponent";
import { GoComment } from "react-icons/go";
import { Reply } from "lucide-react";
import debounce from "lodash.debounce"; // Import lodash debounce

function Comment(props) {
  const [likeCount, setLikeCount] = useState(props.body.likes.length);
  const [btnColor, setBtnColor] = useState(props.body.likeCommentBtn);
  const [commentContent, setCommentContent] = useState(props.body.content);
  const [isEdited, setIsEdited] = useState(props.body.isEdited);
  const commentId = props.body.postedCommentTime;
  const isUserActive = props.body.postedBy.username === props.user;
  const url = useContext(UrlContext);
  const [replyInput, setReplyInput] = useState(
    `@${props.body.postedBy.username} `
  ); // State for the reply input

  // Memoized debounced function to update the input state
  const debouncedSetReplyInput = useMemo(
    () =>
      debounce((value) => {
        setReplyInput(value);
      }, 300), // 300ms debounce delay
    []
  );
  // Handle liking a comment
  const handleLike = async (e) => {
    e.preventDefault();
    try {
      const req = await fetch(
        `${url}/comment/${props.user}/like/${commentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await req.json();
      if (data.status === "ok") {
        setBtnColor(data.btnColor);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // Handle deleting a comment
  const deleteComment = async (e) => {
    e.preventDefault();
    try {
      const req = await fetch(`${url}/comment/delete/${commentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        // Remove the deleted comment from the comments state in the parent component
        props.setComments((prevComments) =>
          prevComments.filter(
            (comment) => comment.postedCommentTime !== commentId
          )
        );
        props.setCommentCount((prevCount) => prevCount - 1); // Decrease the comment count
      } else {
        console.error("Failed to delete comment:", data.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Handle editing a comment
  const editComment = async (e) => {
    e.preventDefault();
    try {
      const req = await fetch(`${url}/comment/edit/${commentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await req.json();
      if (data.status === "ok") {
        setIsEdited(true);
        props.populateComments();
        // props.updateLoading(true);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      showToast({
        heading: "Error",
        message: "Failed to edit comment",
        type: "error",
      });
    }
  };

  return (
    <li className="flex items-center w-full">
      <div className="!w-[10%] shrink-0 border-b border-border"></div>
      <div className="hover:bg-gray-100 border-b border-l border-border !p-4 flex-1">
        <div className="flex items-start">
          <Link href={`/profile/${props.body.postedBy.username}`}>
            <img
              className="w-13 h-13 rounded-full mr-3"
              src={`${url}/images/${props.body.postedBy.avatar}`}
              alt="Avatar"
            />
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between ">
              <Link href={`/profile/${props.body.postedBy.username}`}>
                <div>
                  <span className="font-bold text-gray-800">
                    {props.body.postedBy.username}
                  </span>
                  <span className="text-sm text-gray-500 !ml-2">
                    {props.body.postedCommentTime}
                    {isEdited && <span className="ml-1 italic">(edited)</span>}
                  </span>
                </div>
              </Link>
              {isUserActive && (
                <Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="cursor-pointer text-gray-500 hover:text-gray-700">
                        <BsThreeDots />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <form onSubmit={deleteComment}>
                          <button className=" flex items-center !p-2">
                            <RiDeleteBin6Fill className="!mr-2" /> Delete
                          </button>
                        </form>
                      </DropdownMenuItem>
                      <DialogTrigger className="!w-full !p-2" asChild>
                        <DropdownMenuItem asChild>
                          <button className=" flex items-center">
                            <AiFillEdit className="!mr-2" /> Edit
                          </button>
                        </DropdownMenuItem>
                      </DialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DialogContent className="!p-4">
                    <DialogHeader>
                      <DialogTitle>Edit Comment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={editComment}>
                      <input
                        type="text"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="!w-full !border-b !border-border  !p-2 !mb-4"
                        required
                      />
                      <button type="submit" className="tweetBtn">
                        Save
                      </button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="text-gray-800 mt-2">{props.body.content}</div>
          </div>
        </div>
        <div className="flex items-center !mt-3 !space-x-4">
          <button
            className={`cursor-pointer flex items-center gap-1 ${
              btnColor === "deeppink" ? "text-pink-500" : "text-gray-500"
            }`}
            onClick={handleLike}
          >
            <AiOutlineLike className="mr-1" />
            <span>{likeCount}</span>
          </button>

          <Dialog>
            <DialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()} // Prevents triggering the link
                className="cursor-pointer flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <Reply strokeWidth={1.4} className="mr-1" />
                {/* <span>{comments?.length > 0 && comments?.length}</span> */}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  props.handleCommentSubmit(e);
                  setReplyInput("");
                }}
              >
                <input
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                  name="commentInput"
                  defaultValue={`@${props.body.postedBy.username} `} // Pre-fill the input
                  onChange={(e) => debouncedSetReplyInput(e.target.value)} // Use debounced function for input changes
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
    </li>
  );
}

export default Comment;
