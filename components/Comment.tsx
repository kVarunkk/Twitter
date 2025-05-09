"use client";

import React, { useState, useContext, useMemo, useRef } from "react";
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
import { formatContentWithLinks } from "utils/utils";
import Avatar from "./Avatar";
import AppLoader from "./AppLoader";

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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
        `${url}/api/comment/${props.user}/like/${commentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //"x-access-token": localStorage.getItem("token"),
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
    setDeleteLoading(true);
    try {
      const req = await fetch(`${url}/api/comment/delete/${props.body._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"x-access-token": localStorage.getItem("token"),
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
        showToast({
          heading: "Error",
          message: "Failed to delete comment",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast({
        heading: "Error",
        message: "Failed to delete comment",
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle editing a comment
  const editComment = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const req = await fetch(`${url}/api/comment/edit/${commentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"x-access-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await req.json();
      if (data.status === "ok") {
        showToast({
          heading: "Success",
          message: "Comment edited successfully",
          type: "success",
        });
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
    } finally {
      setEditLoading(false);
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // set to scrollHeight
    }
  };
  return (
    <li className="flex items-center w-full">
      <div className="!w-[10%] shrink-0 border-b border-border"></div>
      <div className="hover:bg-gray-100 border-b border-l border-border !p-4 flex-1">
        <div className="flex ">
          <Link
            className="shrink-0 !p-1 h-fit"
            href={`/profile/${props.body.postedBy.username}`}
          >
            {/* <img
              className="w-12 h-12 rounded-full"
              src={`${props.body.postedBy.avatar}`}
              alt="Avatar"
            /> */}
            <Avatar
              src={`${props.body.postedBy.avatar}`}
              alt="Avatar"
              size="md"
            />
          </Link>
          <div className="!shrink !flex-1 !min-w-0">
            <div className="flex items-center justify-between ">
              <Link
                className="!p-1 group"
                href={`/profile/${props.body.postedBy.username}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-800 group-hover:underline">
                    {props.body.postedBy.username}
                  </span>
                  <span className="text-sm text-gray-500 ">
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
                          <button
                            disabled={deleteLoading}
                            className={`!p-2 flex items-center !justify-between disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center">
                              <RiDeleteBin6Fill className="!mr-2" /> Delete
                            </div>
                            {deleteLoading && (
                              <div className="ml-auto">
                                <AppLoader size="sm" />
                              </div>
                            )}
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
                      <textarea
                        ref={textareaRef}
                        onInput={autoResize}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="!w-full focus:outline-none !border-b !border-border  !p-2 !mb-4"
                        required
                      />
                      <button
                        type="submit"
                        disabled={editLoading}
                        className={` ${
                          editLoading ? "disabled" : "tweetBtn"
                        } flex items-center gap-2`}
                      >
                        Save
                        {editLoading && <AppLoader size="sm" color="white" />}
                      </button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="text-gray-800 mt-2 break-words whitespace-pre-wrap">
              {formatContentWithLinks(props.body.content)}
            </div>
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
                <textarea
                  ref={textareaRef}
                  onInput={autoResize}
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                  name="commentInput"
                  defaultValue={`@${props.body.postedBy.username} `} // Pre-fill the input
                  onChange={(e) => debouncedSetReplyInput(e.target.value)} // Use debounced function for input changes
                  className="!w-full !border-b !border-border focus:outline-none !p-2 !mb-4"
                  required
                />
                <button
                  onClick={(e) => e.stopPropagation()} // Prevents event bubbling
                  type="submit"
                  disabled={props.replyLoading}
                  className={` ${
                    props.replyLoading ? "disabled" : "tweetBtn"
                  } flex items-center gap-2`}
                >
                  Reply
                  {props.replyLoading && <AppLoader size="sm" color="white" />}
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
