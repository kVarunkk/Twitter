"use client";

import React, { useState, useContext } from "react";
import Tweet from "@/components/Tweet";
import ChatWrapper from "@/components/ChatWrapper";
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
