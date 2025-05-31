"use client";

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BsTwitter } from "react-icons/bs";
import { BiHome } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { AiOutlineSearch } from "react-icons/ai";
import { BiChevronsRight } from "react-icons/bi";
import { GrLogout } from "react-icons/gr";
import "reactjs-popup/dist/index.css";
import "../app/globals.css";
import { UrlContext } from "../context/urlContext";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Mail, SendHorizonal, Wand, X } from "lucide-react";
import Chat from "./Chat";
import TweetDialog from "./TweetDialog";
import { useAuth } from "hooks/useAuth";

function Sidebar() {
  const [activeUser, setActiveUser] = useState("");
  const url = useContext(UrlContext);
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  let lastScrollY = 10;
  const { user, loading } = useAuth();

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

  useEffect(() => {
    if (!loading && user) {
      setActiveUser(user.username);
    }
  }, [user, loading]);

  const logout = async () => {
    fetch(url + "/api/logout", {
      method: "POST",
      credentials: "include",
    });

    // Remove any local-only items
    localStorage.removeItem("privateKey");

    // Redirect user
    router.push("/");
  };

  return (
    <div
      className={`bg-white sidebar  sm:!border-0 !border-b !border-border ${
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
            href="/notifications"
            className={pathname === "/notifications" ? "sidebar-active" : ""}
          >
            <Bell size={18} />
            <div className="hidden sm:block">Notifications</div>
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
        {activeUser && (
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
        )}
        <li className="sidebar-menu-items md:!hidden">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`cursor-pointer ${isDrawerOpen && "sidebar-active"}`}
          >
            <Mail size={19} />
            <div className="hidden sm:block ">Messages</div>
          </button>
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
          <TweetDialog />
        </li>
      </ul>
      <Chat isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
    </div>
  );
}

export default Sidebar;
