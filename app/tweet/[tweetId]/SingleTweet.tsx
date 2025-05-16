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

function SingleTweet({ tweetId }: { tweetId: string }) {
  const [tweet, setTweet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState("");
  const [visibleComments, setVisibleComments] = useState(5); // Show 5 comments initially
  const url = useContext(UrlContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userId, setUserId] = useState("");

  const { user, loading: load } = useAuth();

  useEffect(() => {
    if (!load && user) {
      fetchTweet();
    }
  }, [user, load]);

  const fetchTweet = async () => {
    try {
      const response = await fetch(`${url}/api/tweet/${tweetId}`, {
        headers: {
          //"x-access-token": localStorage.getItem("token"),
        },
      });
      const data = await response.json();
      if (data.status === "ok") {
        setTweet({
          ...data.tweet,
          likeTweetBtn: data.tweet.likes.includes(data.activeUser.username)
            ? "deeppink"
            : "black",
          retweetBtn: data.tweet.retweets.includes(data.activeUser.username)
            ? "green"
            : "black",
        });
        setActiveUser(data.activeUser.username);
        setUserId(data.activeUser._id);
      } else {
        console.error("Error fetching tweet:", data.message);
      }
    } catch (error) {
      console.error("Error fetching tweet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen">
        <AppLoader size="md" />
      </div>
    );
  }

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
