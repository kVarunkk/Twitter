"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { BsTwitter } from "react-icons/bs";
import { BiHome } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { AiFillCamera } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { BiChevronsRight } from "react-icons/bi";
import { GrLogout } from "react-icons/gr";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import moment from "moment";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../app/globals.css";
import { v4 as uuidv4 } from "uuid";
import jwtDecode from "jwt-decode";
import { UrlContext } from "../context/urlContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { usePathname, useRouter } from "next/navigation";
import { showToast } from "./ToastComponent";
import { Info, Mail, SendHorizonal, Wand, X } from "lucide-react";
import Chat from "./Chat";
import AppLoader from "./AppLoader";
import { TagSelector } from "./TagSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";

export default function TweetDialog() {
  const [input, setInput] = useState("");
  const [img, setImg] = useState("");
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [tag, setTag] = useState("");
  const [index1, setIndex1] = useState<number | null>(null);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tweetGenError, setTweetGenError] = useState(null);
  const [tweetGenLoading, setTweetGenLoading] = useState(false);
  const tags = useMemo(
    () => [
      "Sports",
      "Politics",
      "Love",
      "Education",
      "Tech",
      "Finance",
      "Gaming",
      "Entertainment",
    ],
    []
  );
  const url = useContext(UrlContext);
  const checkInput = input.trim().length || img.trim().length || file;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeUser, setActiveUser] = useState(null);
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
  useEffect(() => {
    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImg(""); // Clear URL input if file is selected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkInput) return;

    setTweetLoading(true);

    let imageUrl = img;

    const tempId = uuidv4();

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "tweet");
        formData.append("id", tempId);
        formData.append("contentType", file.type);

        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        const { key } = await res.json();

        imageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
      }

      const payload = {
        tweet: {
          content: input,
          tag: tag,
          postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
        },
        image: imageUrl,
      };

      const response = await axios.post(`${url}/api/feed`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.status === "ok") {
        setInput("");
        setImg("");
        setFile(null);
        setTag("");
        setIsImageSelected(false);
        showToast({
          heading: "Success 🎉",
          message: (
            <div>
              Tweet sent successfully,{" "}
              <Link
                href={`/tweet/${response.data.tweet?.postedTweetTime}`}
                style={{ textDecoration: "underline" }}
              >
                View
              </Link>
            </div>
          ),
          type: "success",
        });
      } else {
        showToast({
          heading: "Error ",
          message: response.data.message || "Failed to post tweet",
          type: "error",
        });
      }
    } catch (error) {
      // console.error("Error posting tweet:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setTweetLoading(false);
    }
  };
  const handleChange = (e) => {
    setInput(e.target.value);
  };
  const handleSubmitTag = useCallback((e) => {
    setTag(e.target.innerText);
  }, []);

  const generateTweet = async () => {
    if (!prompt) return;
    setTweetGenLoading(true);

    setTweetGenError(null);
    setInput(""); // reset to empty or "Loading..."
    try {
      const response = await fetch(`${url}/api/gen-tweet`, {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
              setInput((prev) => prev + token);
            } catch (err) {
              console.error("JSON parse error:", err);
              setTweetGenError("Failed to parse response. Please try again.");
              throw err; // Stop the loop on error
            }
          }
        }
      }
      setPrompt(""); // Clear prompt after generation
      fetchUser(); // Fetch user data again to update the count
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
    <Dialog>
      <DialogTrigger className="!mx-2 sm:!mx-0" asChild>
        <button className="tweetBtn sidebar-menu-tweetBtn">Tweet</button>
      </DialogTrigger>
      <DialogContent className="!w-full !max-w-[95%] lg:!max-w-1/2 h-3/4  !p-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>New Tweet</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            handleSubmit(e);
            close();
          }}
          method="post"
          encType="multipart/form-data"
          action={`${url}/api/feed`}
          className="tweet-form flex flex-col gap-4 flex-grow overflow-y-scroll"
          id="form1"
        >
          <div className="flex flex-col gap-2 !p-1">
            <textarea
              ref={textareaRef}
              disabled={tweetLoading || tweetGenLoading}
              autoFocus
              onInput={autoResize}
              placeholder="What's good?"
              value={input}
              onChange={handleChange}
              className="transition-[height] duration-200 ease-in-out overflow-y-hidden resize-none w-full !p-2   rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              {!showPromptInput && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={activeUser && activeUser.tweetGenCount === 5}
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
                      {activeUser && 5 - activeUser.tweetGenCount} AI Tweet uses
                      available.
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {showPromptInput && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <input
                      disabled={tweetLoading || tweetGenLoading}
                      placeholder="Enter prompt to generate tweet"
                      value={prompt}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        disabled={
                          tweetLoading ||
                          tweetGenLoading ||
                          prompt.trim().length === 0 ||
                          prompt.length > 150
                        }
                        onClick={generateTweet}
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
          </div>
          <div className="tweet-flex flex-col  items-center gap-4">
            <div className="w-full">
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-4 cursor-pointer border-2 border-dashed border-gray-400 w-full rounded-lg !px-6 !py-3 text-center text-gray-600 hover:bg-gray-100 transition"
              >
                <AiFillCamera
                  className="shrink-0"
                  style={{
                    color: "#1DA1F2",
                    fontSize: "1.5rem",
                  }}
                />
                <div>
                  <span className="block text-sm">Click here to upload</span>
                  <span className="text-xs text-gray-400">
                    (Only images allowed)
                  </span>
                </div>
              </label>
            </div>

            <span className="text-gray-500 font-bold">OR</span>

            <div className="flex items-center gap-1 w-full">
              <AiFillCamera
                className="shrink-0"
                style={{
                  color: "#1DA1F2",
                  fontSize: "1.5rem",
                }}
              />
              <input
                type="text"
                placeholder="Enter an image url"
                className="flex-grow !p-2 !border-b !border-gray-300 !rounded-none focus:outline-0"
                value={img}
                onChange={(e) => {
                  setImg(e.target.value);
                  setFile(null); // clear local file if URL is typed
                }}
              />
            </div>
          </div>

          <TagSelector tags={tags} handleSubmitTag={handleSubmitTag} />

          {file && (
            <div className="relative">
              <button
                onClick={() => setFile(null)}
                className="cursor-pointer absolute -top-2 right-2 !p-3 rounded-full bg-white shadow-lg"
              >
                <X />
              </button>
              <img
                src={URL.createObjectURL(file)}
                className="tweet-preview max-h-60 object-contain mt-4"
              />
            </div>
          )}
          {img && !file && (
            <div className="relative">
              <button
                onClick={() => setImg("")}
                className="cursor-pointer absolute -top-2 right-2 !p-3 rounded-full bg-white shadow-lg"
              >
                <X />
              </button>
              <img
                src={img}
                className="tweet-preview max-h-60 object-contain mt-4"
              />
            </div>
          )}
        </form>
        <DialogFooter className="flex items-center !justify-between w-full">
          <div className="text-gray-600 text-sm">
            {280 - input.length} characters left
          </div>
          <button
            form="form1"
            className={`${
              checkInput && !tweetLoading && input.length <= 280
                ? "tweetBtn"
                : "disabled"
            }  flex items-center gap-2`}
            disabled={!checkInput || tweetLoading || input.length > 280}
            type="submit"
          >
            Tweet
            {tweetLoading && <AppLoader size="sm" color="white" />}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
