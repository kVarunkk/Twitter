"use client";

import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { BsTwitter } from "react-icons/bs";
import { BiHome } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { AiFillCamera } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { BiChevronsRight } from "react-icons/bi";
import { GrLogout } from "react-icons/gr";
// import { useToast } from "@chakra-ui/toast";
// import { Tag } from "@chakra-ui/react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import moment from "moment";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
// import { Box } from "@chakra-ui/react";
import "../app/globals.css";

import jwtDecode from "jwt-decode";
import { UrlContext } from "../context/urlContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { usePathname, useRouter } from "next/navigation";
import { showToast } from "./ToastComponent";

function Sidebar() {
  const [activeUser, setActiveUser] = useState("");
  const [input, setInput] = useState("");
  const [img, setImg] = useState("");
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [tag, setTag] = useState("");
  const [index1, setIndex1] = useState<number | null>(null);
  const url = useContext(UrlContext);
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  let lastScrollY = 10;

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 640) {
        // Apply only for mobile screens (sm breakpoint)
        if (window.scrollY < lastScrollY) {
          setIsSidebarVisible(true); // Show sidebar when scrolling up
        } else {
          setIsSidebarVisible(false); // Hide sidebar when scrolling down
        }
        lastScrollY = window.scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const tags = [
    "Sports",
    "Politics",
    "Love",
    "Education",
    "Tech",
    "Finance",
    "Gaming",
    "Entertainment",
  ];

  const checkInput = input || img;

  async function populateUser() {
    try {
      const req = await fetch(`${url}/api/feed`, {
        headers: {
          "x-access-token": localStorage.getItem("token"),
        },
      });

      const data = await req.json();

      if (data.status === "ok") {
        setActiveUser(data.activeUser);
      } else {
        // Handle invalid token or authentication failure
        // console.error("Error fetching user data:", data.error);
        showToast({
          heading: "Error",
          message: "Session expired. Please log in again.",
          type: "error",
        });
        localStorage.removeItem("token"); // Clear the invalid token
        router.push("/"); // Redirect to the home page
      }
    } catch (error) {
      // console.error("Error fetching user data:", error);
      showToast({
        heading: "Error",
        message: "Failed to fetch user data. Please try again later.",
        type: "error",
      });
    }
  }

  useEffect(() => {
    populateUser();
  }, []);

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const logout = (e) => {
    localStorage.removeItem("token");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      tweet: {
        content: input,
        tag: tag,
        postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
      },
      image: img || "", // Include the image or an empty string if not provided
    };

    try {
      const response = await axios.post(`${url}/api/feed`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token"),
        },
      });

      if (response.data.status === "ok") {
        setInput("");
        setImg("");
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
    }
  };

  const handleSubmitTag = (e) => {
    setTag(e.target.innerText);
  };

  return (
    <div
      className={`bg-white sidebar sm:!border-0 !border-b !border-border ${
        isSidebarVisible
          ? "!fixed !top-0 !left-0 !w-full !z-50 sm:static sm:!w-fit sm:!ml-auto sm:!left-auto "
          : "!hidden sm:!block"
      }`}
    >
      <ul className="sidebar-menu">
        <li className="sidebar-menu-items">
          <div className="title">
            <Link href="/feed">
              <BsTwitter />
            </Link>
          </div>
        </li>
        <li className="sidebar-menu-items">
          <Link
            href="/feed"
            className={pathname === "/feed" ? "sidebar-active" : ""}
          >
            <BiHome />
            <div className="hidden sm:block">Home</div>
          </Link>
        </li>
        <li className="sidebar-menu-items">
          <Link
            href="/topic/Sports"
            className={pathname.startsWith("/topic") ? "sidebar-active" : ""}
          >
            <BiChevronsRight />
            <div className="hidden sm:block">Topics</div>
          </Link>
        </li>
        <li className="sidebar-menu-items">
          <Link
            href={`/profile/${activeUser}`}
            className={
              pathname === `/profile/${activeUser}` ? "sidebar-active" : ""
            }
          >
            <CgProfile />
            <div className="hidden sm:block">Profile</div>
          </Link>
        </li>
        <li className="sidebar-menu-items">
          <Link
            href="/search"
            className={pathname === "/search" ? "sidebar-active" : ""}
          >
            <AiOutlineSearch />
            <div className="hidden sm:block">Search</div>
          </Link>
        </li>
        <li onClick={logout} className="sidebar-menu-items">
          <Link href="/">
            <GrLogout />
            <div className="hidden sm:block">Logout</div>
          </Link>
        </li>
        <li className="sidebar-menu-items tweet-list-item">
          <Dialog>
            <DialogTrigger className="!mx-2 sm:!mx-0" asChild>
              <button className="tweetBtn sidebar-menu-tweetBtn">Tweet</button>
            </DialogTrigger>
            <DialogContent className="!w-full !max-w-[95%] lg:!max-w-1/2 h-3/4 overflow-hidden !p-4 flex flex-col">
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
                className="tweet-form flex flex-col gap-4 flex-grow"
                id="form1"
              >
                <input
                  autoFocus
                  placeholder="What's good?"
                  type="text"
                  value={input}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="tweet-flex flex items-center gap-4">
                  <AiFillCamera
                    style={{
                      color: "#1DA1F2",
                      fontSize: "1.5rem",
                    }}
                  />
                  <input
                    className="image-input flex-grow p-2 border border-gray-300 rounded-md"
                    type="text"
                    placeholder="Enter an image url here"
                    value={img}
                    onChange={(e) => setImg(e.target.value)}
                  />
                  <button
                    className={checkInput ? "tweetBtn" : "disabled"}
                    disabled={!checkInput}
                    type="submit"
                  >
                    Tweet
                  </button>
                </div>
                <div className="tagArea overflow-x-auto whitespace-nowrap   ">
                  <ToggleGroup type="single" className="inline-flex gap-2">
                    {tags.map((tag, index) => (
                      <ToggleGroupItem
                        size="default"
                        key={tag}
                        value={tag}
                        onClick={(e) => {
                          handleSubmitTag(e);
                        }}
                      >
                        {tag}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                {img && (
                  <img
                    className="tweet-preview max-h-40 object-contain mt-4"
                    src={img}
                    alt="Preview"
                  />
                )}
              </form>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
