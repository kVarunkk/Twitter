"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import { AiOutlineLike, AiOutlineRetweet } from "react-icons/ai";
import { GoComment } from "react-icons/go";
import { UrlContext } from "context/urlContext";
import Tweet from "@/components/Tweet";
import AppLoader from "@/components/AppLoader";
import ChatWrapper from "@/components/ChatWrapper";
import { useAuth } from "hooks/useAuth";
import { IPopulatedTweet } from "utils/types";

function SingleTweet({
  tweetProp,
  activeUserProp,
}: {
  tweetProp: IPopulatedTweet;
  activeUserProp: string;
}) {
  const [tweet, setTweet] = useState(tweetProp || null);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(activeUserProp || "");
  const [visibleComments, setVisibleComments] = useState(5); // Show 5 comments initially
  const url = useContext(UrlContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userId, setUserId] = useState("");

  if (!tweet) {
    return (
      <div className="text-center text-gray-500 !mt-20">Tweet not found.</div>
    );
  }

  return (
    <>
      <Tweet
        updateLoading={setLoading}
        user={activeUser}
        body={tweet}
        setTweet={setTweet}
        userId={userId}
      />
      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </>
  );
}

export default SingleTweet;
