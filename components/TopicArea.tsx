"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
// import { Tag } from "@chakra-ui/react";
import Tweet from "./Tweet";
import { UrlContext } from "../context/urlContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import AppLoader from "./AppLoader";
import Header from "./Header";
import ChatWrapper from "./ChatWrapper";
import InfiniteScrolling from "./InfiniteScrolling";
import { IPopulatedTweet } from "utils/types";
import ScrollToTop from "./ScrollToTop";

type TopicAreaProps = {
  tag: string;
  initialTweets: IPopulatedTweet[];
  activeUserProp: string;
  userIdProp: string;
};

function TopicArea({
  tag,
  initialTweets,
  activeUserProp,
  userIdProp,
}: TopicAreaProps) {
  const [tweets, setTweets] = useState(initialTweets || []);
  const [loading, setLoading] = useState(false);
  const [activeUser, setActiveUser] = useState(activeUserProp || "");
  const [userId, setUserId] = useState(userIdProp || "");
  const [tweetCount, setTweetCount] = useState(20);
  const [currentTag, setCurrentTag] = useState(tag || "Sports");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const url = useContext(UrlContext);
  const router = useRouter();
  const isFetching = useRef(false);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);
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

  // Load more tweets
  const loadMoreTweets = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const req = await fetch(
        `${url}/api/topic/${currentTag}?t=${tweetCount}`,
        {
          headers: {
            //"x-access-token": localStorage.getItem("token") || "",
          },
        }
      );

      const data = await req.json();
      if (data.status === "ok") {
        setTweets((prevTweets) => [...prevTweets, ...data.tweets]);
        if (data.tweets.length < 20) {
          setHasMoreTweets(false);
        }
        setTweetCount((prevCount) => prevCount + 20);
      } else {
        console.error(data.error);
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading more tweets:", error);
    } finally {
      isFetching.current = false;
    }
  };

  // Handle tag change
  const handleTagChange = (tag: string) => {
    setCurrentTag(tag);
    setTweetCount(20); // Reset tweet count when changing topics
  };

  return (
    <div>
      {/* Tag Area */}
      <div className="tagArea !px-4">
        <ToggleGroup type="single" className="inline-flex gap-2">
          {tags.map((tag) => (
            <Link key={tag} href={`/topic/${tag}`}>
              <ToggleGroupItem
                size="default"
                key={tag}
                value={tag}
                className={currentTag === tag ? "active-class" : ""} // Add active class if the tag matches the currentTag
                onClick={() => handleTagChange(tag)} // Update the tag when clicked
              >
                {tag}
              </ToggleGroupItem>
            </Link>
          ))}
        </ToggleGroup>
      </div>

      {/* Tweets Section */}
      <div className="userTweets">
        <div className="text-xl font-bold !mb-4 !ml-4">Tweets</div>
        <div className="tweets">
          <ul className="tweet-list">
            {loading ? (
              <div className="h-screen">
                <AppLoader size="md" />
              </div>
            ) : (
              tweets.map((tweet, index) => (
                <Tweet
                  key={index}
                  user={activeUser}
                  body={tweet}
                  setTweets={setTweets}
                  userId={userId}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {tweets.length === 0 && !loading && (
        <div className="text-center text-gray-500 !mt-20">
          No tweets found for this topic.
        </div>
      )}

      {/* Load More Button */}
      {tweets.length > 0 && !loading && hasMoreTweets && (
        <InfiniteScrolling addTweets={loadMoreTweets} />
      )}
      <ScrollToTop />
      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </div>
  );
}

export default TopicArea;
