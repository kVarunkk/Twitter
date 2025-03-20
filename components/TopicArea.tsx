"use client";

import React, { useState, useEffect, useContext } from "react";
// import { Tag } from "@chakra-ui/react";
import Tweet from "./Tweet";
import { UrlContext } from "../context/urlContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import AppLoader from "./AppLoader";

function TopicArea({ tag: initialTag }: { tag: string }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState("");
  const [tweetCount, setTweetCount] = useState(20);
  const [currentTag, setCurrentTag] = useState(initialTag || "Sports");
  const url = useContext(UrlContext);
  const router = useRouter();

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

  // Fetch tweets when the tag changes
  useEffect(() => {
    fetchTweets(currentTag);
  }, [currentTag]);

  // Fetch tweets for the selected topic
  const fetchTweets = async (tag: string) => {
    setLoading(true);
    try {
      const req = await fetch(`${url}/topic/${tag}`, {
        headers: {
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        setTweets(data.tweets);
        setActiveUser(data.activeUser.username);
      } else {
        console.error(data.error);
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load more tweets
  const loadMoreTweets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const req = await fetch(`${url}/topic/${currentTag}?t=${tweetCount}`, {
        headers: {
          "x-access-token": localStorage.getItem("token") || "",
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        setTweets((prevTweets) => [...prevTweets, ...data.tweets]);
        setTweetCount((prevCount) => prevCount + 20);
      } else {
        console.error(data.error);
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading more tweets:", error);
    }
  };

  // Handle tag change
  const handleTagChange = (tag: string) => {
    setCurrentTag(tag);
    setTweetCount(20); // Reset tweet count when changing topics
  };

  return (
    <div className="HeaderAndFeed">
      {/* Tag Area */}
      <div className="tagArea">
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
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Load More Button */}
      <form className="showMore-form !mb-10" onSubmit={loadMoreTweets}>
        <button className="showMore" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Show more tweets"}
        </button>
      </form>
    </div>
  );
}

export default TopicArea;
