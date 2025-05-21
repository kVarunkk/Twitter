"use client";

import React, { useState, useContext, useRef } from "react";
import Tweet from "./Tweet";
import "reactjs-popup/dist/index.css";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import ScrollToTop from "./ScrollToTop";
import AppLoader from "./AppLoader";
import { showToast } from "./ToastComponent";
import ChatWrapper from "./ChatWrapper";
import InfiniteScrolling from "./InfiniteScrolling";

function Feed({ initialTweets, activeUserProp, userIdProp }) {
  const [error, setError] = useState(false);
  const [tweets, setTweets] = useState(initialTweets || []);
  const [loading, setLoading] = useState(false);
  const [activeUser, setActiveUser] = useState(activeUserProp || "");
  const [tweetCount, setTweetCount] = useState("20");
  const url = useContext(UrlContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isFetching = useRef(false);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);
  const [userId, setUserId] = useState(userIdProp || "");

  async function populateTweets() {
    try {
      const req = await fetch(`${url}/api/feed`);

      const data = await req.json();

      if (data.status === "ok") {
        const updatedTweets = data.tweets.map((tweet) => ({
          ...tweet,
          likeTweetBtn: tweet.likeTweetBtn || "black",
          retweetBtn: tweet.retweetBtn || "black",
          postedBy: tweet.postedBy || {}, // Ensure postedBy is always an object
          comments: tweet.comments || [], // Ensure comments is always an array
        }));

        setTweets(updatedTweets);
        setActiveUser(data.activeUser || ""); // Ensure activeUser is set correctly
        setUserId(data.activeUserId || "");
        setLoading(false);
        setError(false); // Reset error state on success
      } else {
        console.error("Error fetching tweets:", data.message);
        setError(true); // Set error state
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
      setError(true);
      showToast({
        heading: "Error",
        type: "error",
        message: "Failed to fetch tweets. Please try again.",
      });
      // Set error state
    } finally {
      setLoading(false);
    }
  }

  async function addTweets() {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const req = await fetch(`${url}/api/feed?t=${tweetCount}`, {
        headers: {
          //"x-access-token": localStorage.getItem("token"),
        },
      });

      const data = await req.json();
      if (data.status === "ok") {
        const updatedTweets = data.tweets.map((tweet) => ({
          ...tweet,
          likeTweetBtn: tweet.likeTweetBtn || "black",
          retweetBtn: tweet.retweetBtn || "black",
        }));

        setTweets((prevTweets) => {
          const tweetMap = new Map();

          // Add old tweets
          prevTweets.forEach((tweet) => tweetMap.set(tweet._id, tweet));

          // Add new tweets (overwrites duplicates with latest version)
          updatedTweets.forEach((tweet) => tweetMap.set(tweet._id, tweet));

          return Array.from(tweetMap.values());
        });

        if (updatedTweets.length < 20) {
          setHasMoreTweets(false);
        }
        setTweetCount((prevValue) => (parseInt(prevValue) + 20).toString());
      } else {
        // toast.error(data.message || "Failed to fetch more tweets");
        showToast({
          heading: "Error",
          type: "error",
          message: "Failed to fetch tweets. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error adding tweets:", error);
    } finally {
      isFetching.current = false;
    }
  }

  return (
    <div>
      <div className="tweets">
        <ul className="tweet-list">
          {loading ? (
            <div className="h-screen">
              <AppLoader size="md" color="blue" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-screen">
              <p className="text-gray-500 text-lg !mb-4">
                Failed to fetch tweets. Please try again.
              </p>
              <button
                className="tweetBtn"
                onClick={() => {
                  populateTweets();
                }} // Retry fetching tweets
              >
                Retry
              </button>
            </div>
          ) : (
            tweets.map(function (tweet) {
              return (
                <div key={tweet._id}>
                  <Tweet
                    updateLoading={setLoading}
                    user={activeUser}
                    body={tweet}
                    setTweets={setTweets}
                    userId={userId}
                  />
                </div>
              );
            })
          )}
        </ul>
      </div>
      {!loading && !error && tweets.length > 0 && hasMoreTweets && (
        <InfiniteScrolling addTweets={addTweets} />
      )}
      <ScrollToTop />

      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </div>
  );
}

export default Feed;
