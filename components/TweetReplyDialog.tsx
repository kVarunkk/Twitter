"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { GoComment } from "react-icons/go";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { Info, SendHorizonal, Wand, X } from "lucide-react";
import AppLoader from "./AppLoader";
import { useContext, useEffect, useRef, useState } from "react";
import { showToast } from "./ToastComponent";
import { UrlContext } from "context/urlContext";
import { IPopulatedTweet, IUser } from "utils/types";

type TweetReplyDialogProps = {
  handleCommentSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    comment: string
  ) => void;
  comments: any[];
  replyLoading: boolean;
  username: string;
  tweetBody: IPopulatedTweet;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
};

export default function TweetReplyDialog({
  handleCommentSubmit,
  comments,
  replyLoading,
  username,
  tweetBody,
  isDialogOpen,
  setIsDialogOpen,
}: TweetReplyDialogProps) {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [prompt, setPrompt] = useState("");
  const tweetInputRef = useRef<HTMLTextAreaElement>(null);
  const [tweetGenError, setTweetGenError] = useState<string | null>(null);
  const [tweetGenLoading, setTweetGenLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [tweetReply, setTweetReply] = useState("");
  const url = useContext(UrlContext);
  const [activeUser, setActiveUser] = useState<IUser>();

  const fetchUser = async () => {
    try {
      const req = await fetch(`${url}/api/active-user`);

      const data = await req.json();
      if (data.status === "ok") {
        setActiveUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const generateTweetReply = async () => {
    if (!prompt) return;
    setTweetGenLoading(true);

    setTweetGenError(null);
    setTweetReply(""); // reset to empty or "Loading..."
    try {
      const response = await fetch(`${url}/api/gen-tweet-reply`, {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweet: tweetBody, prompt }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming not supported or server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialChunk = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialChunk += decoder.decode(value, { stream: true });

        // Parse complete SSE events (split by double newline)
        const events = partialChunk.split("\n\n");
        partialChunk = events.pop() || ""; // Save incomplete chunk

        for (const event of events) {
          if (event.startsWith("data:")) {
            try {
              const json = JSON.parse(event.replace(/^data:\s*/, ""));
              const token = json.data?.delta || "";
              // console.log("Token:", token);
              setTweetReply((prev) => prev + token);
            } catch (err) {
              console.error("JSON parse error:", err);
              setTweetGenError("Failed to parse response. Please try again.");
              throw err; // Stop the loop on error
            }
          }
        }
      }
      setPrompt("");
      fetchUser();
    } catch (error) {
      showToast({
        heading: "Error",
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setTweetGenLoading(false);
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
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setTweetReply("");
          setPrompt("");
          setShowPromptInput(false);
          setTweetGenError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchUser();
          }} // Prevents triggering the link
          className="cursor-pointer flex items-center gap-1 text-gray-500 hover:text-gray-700 active:text-gray-700"
        >
          <GoComment className="mr-1" />
          <span>{comments?.length > 0 && comments?.length}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="!p-4">
        <DialogHeader>
          <DialogTitle>
            Replying to{" "}
            <Link className="text-[#1DA1F2]" href={`/profile/${username}`}>
              @{username}
            </Link>
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => handleCommentSubmit(e, tweetReply)}
          id="tweetReplyForm"
        >
          <textarea
            ref={textareaRef}
            onInput={autoResize}
            disabled={replyLoading || tweetGenLoading}
            onClick={(e) => e.stopPropagation()} // Prevents event bubbling
            name="commentInput"
            value={tweetReply}
            onChange={(e) => {
              e.stopPropagation();
              setTweetReply(e.target.value);
            }}
            placeholder="Tweet your reply"
            className="!w-full !border-b !border-border focus:outline-0 !p-2 !mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <div className="!mb-2">
            {!showPromptInput && (
              <div className="flex items-center gap-1">
                <button
                  disabled={activeUser && activeUser.tweetReplyGenCount === 5}
                  type="button"
                  onClick={() => {
                    setShowPromptInput(!showPromptInput);
                    setPrompt("");
                  }}
                  className="cursor-pointer text-[#0b92e6] text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>Start writing using AI Copilot</div> <Wand />
                </button>

                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="text-sm text-gray-500"
                  >
                    <Info size={16} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {activeUser && 5 - activeUser.tweetReplyGenCount} AI Tweet
                    reply uses available.
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {showPromptInput && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 w-full">
                  <input
                    disabled={tweetGenLoading}
                    placeholder="Enter prompt to generate reply"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      disabled={
                        replyLoading ||
                        tweetGenLoading ||
                        prompt.trim().length === 0 ||
                        prompt.length > 150
                      }
                      onClick={generateTweetReply}
                      type="button"
                      className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tweetGenLoading ? (
                        <AppLoader size="sm" color="black" />
                      ) : (
                        <SendHorizonal />
                      )}
                    </button>
                    <button
                      disabled={tweetGenLoading}
                      onClick={() => {
                        setShowPromptInput(!showPromptInput);
                        setPrompt("");
                      }}
                      type="button"
                      className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  {tweetGenError && (
                    <div className="text-red-500">{tweetGenError}</div>
                  )}
                  <div className="text-gray-600 text-sm">
                    {150 - prompt.length} characters left
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
        <DialogFooter className="flex items-center !justify-between w-full">
          <div className="text-gray-600 text-sm">
            {280 - tweetReply.length} characters left
          </div>

          <button
            form="tweetReplyForm"
            onClick={(e) => e.stopPropagation()} // Prevents event bubbling
            type="submit"
            disabled={
              replyLoading ||
              tweetReply.trim().length === 0 ||
              tweetReply.length > 280 ||
              tweetGenLoading
            }
            className={` ${
              replyLoading ||
              tweetReply.trim().length === 0 ||
              tweetReply.length > 280 ||
              tweetGenLoading
                ? "disabled"
                : "tweetBtn"
            } flex items-center gap-2`}
          >
            Reply
            {replyLoading && <AppLoader size="sm" color="white" />}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
