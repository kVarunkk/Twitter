"use client";

import React, { useState, useContext, useRef, useEffect } from "react";
import Usercard from "./Usercard";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import Header from "./Header";
import Tweet from "./Tweet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { showToast } from "./ToastComponent";
import AppLoader from "./AppLoader";
import ChatWrapper from "./ChatWrapper";
import InfiniteScrolling from "./InfiniteScrolling";

function SearchArea() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [skip, setSkip] = useState(0);
  // const [hasMoreTweets, setHasMoreTweets] = useState(true);
  const [activeUser, setActiveUser] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const url = useContext(UrlContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isFetching = useRef(false);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (text.trim().length === 0) return;

    setLoading(true);

    try {
      const results = await Promise.all([searchUsers(), searchTweets()]);
      const { users, activeUser } = results[0];
      const { tweets } = results[1];

      setActiveUser(activeUser.username);
      setUserId(activeUser._id);
      setUsers(users);
      setTweets(tweets);
    } catch (error) {
      showToast({
        heading: "Error",
        message: "Some error occurred, please try again later",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTweets = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const req = await fetch(
        `${url}/api/search/${text}?skip=${skip}&limit=10`,
        {
          headers: {
            //"x-access-token": localStorage.getItem("token"),
          },
        }
      );

      const data = await req.json();
      if (data.status === "ok") {
        setTweets((prevTweets) => [...prevTweets, ...data.tweets]); // Append new tweets
        setSkip(skip + 10); // Increment skip for the next batch
        setHasMoreTweets(data.tweets.length === 10); // Check if more tweets are available
      } else {
        //console.log(data.error);
      }
    } catch (err) {
      console.error("Error loading more tweets:", err);
    } finally {
      isFetching.current = false;
    }
  };

  const searchUsers = async () => {
    try {
      const embedding = await fetch(`${url}/api/secure/embed-query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: text }),
      });

      const embeddingData = await embedding.json();

      const req = await fetch(`${url}/api/hybrid-search/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
          queryEmbedding: embeddingData.data,
        }),
      });
      const data = await req.json();
      // console.log(data);
      return {
        users: data.results,
        activeUser: data.user,
      };
    } catch (error) {
      // console.log("Error fetching users:", error);
      throw error;
    }
  };

  const searchTweets = async () => {
    try {
      const req = await fetch(`${url}/api/hybrid-search/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
        }),
      });
      const data = await req.json();
      return {
        tweets: data.results,
        activeUser: data.user,
      };
    } catch (error) {
      // console.log("Error fetching users:", error);
      throw error;
    }
  };

  return (
    <div className="HeaderAndFeed">
      <Header title="Search" />
      <form
        className="search-form"
        onSubmit={handleSubmit}
        method="GET"
        action={`${url}/api/search/${text}`}
      >
        <input
          autoFocus
          placeholder="Search users or tweets..."
          value={text}
          onChange={handleChange}
        ></input>
        <div className="flex items-center justify-between">
          <button
            disabled={text.trim().length === 0}
            type="submit"
            className={`!ml-2 ${
              text.trim().length === 0 ? "disabled" : "tweetBtn"
            }`}
          >
            Search
          </button>
          {/* {(users?.length > 0 || tweets?.length > 0) && ( */}
          <div className="text-sm text-gray-500 !mr-2">
            {users ? users.length : 0} users found, {tweets ? tweets.length : 0}{" "}
            tweets found
          </div>
          {/* )} */}
        </div>
      </form>
      <div className="allResults !mt-4">
        {users.length === 0 &&
        tweets.length === 0 &&
        text.length !== 0 &&
        !loading ? (
          <h1 className="text-gray-500 text-center !mt-10">No results found</h1>
        ) : loading ? (
          <div className="text-center !mt-20">
            <AppLoader />
          </div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tweets">Tweets</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              {users.map((user) => (
                <Usercard
                  key={user._id}
                  avatar={user.avatar}
                  username={user.username}
                  bio={user.bio}
                  followers={user.followers}
                />
              ))}
            </TabsContent>
            <TabsContent value="tweets">
              {tweets.map((tweet) => (
                <Tweet
                  key={tweet._id}
                  body={tweet}
                  user={activeUser}
                  setTweets={setTweets}
                  userId={userId}
                />
              ))}
              {/* {hasMoreTweets && tweets.length > 0 && (
                <InfiniteScrolling addTweets={loadMoreTweets} />
              )} */}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </div>
  );
}

export default SearchArea;
