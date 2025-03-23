"use client";

import React, { useState, useContext } from "react";
import Usercard from "./Usercard";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import Header from "./Header";
import Tweet from "./Tweet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

function SearchArea() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [skip, setSkip] = useState(0); // For pagination
  const [hasMoreTweets, setHasMoreTweets] = useState(true); // To track if more tweets are available
  const [activeUser, setActiveUser] = useState("");
  const url = useContext(UrlContext);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (text.trim().length === 0) return;

    const req = await fetch(`${e.target.action}?skip=0&limit=10`, {
      headers: {
        "x-access-token": localStorage.getItem("token"),
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      console.log(data);
      setActiveUser(data.activeUser);
      setUsers(data.users);
      setTweets(data.tweets);
      setSkip(10); // Reset skip for pagination
      setHasMoreTweets(data.tweets.length === 10); // Check if more tweets are available
    } else {
      console.log(data.error);
    }
  };

  const loadMoreTweets = async () => {
    const req = await fetch(`${url}/api/search/${text}?skip=${skip}&limit=10`, {
      headers: {
        "x-access-token": localStorage.getItem("token"),
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      setTweets((prevTweets) => [...prevTweets, ...data.tweets]); // Append new tweets
      setSkip(skip + 10); // Increment skip for the next batch
      setHasMoreTweets(data.tweets.length === 10); // Check if more tweets are available
    } else {
      console.log(data.error);
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
            disabled={text.length === 0}
            type="submit"
            className={`!ml-2 tweetBtn ${
              text.trim().length === 0 ? "opacity-50 !cursor-default" : ""
            }`}
          >
            Search
          </button>
          {(users.length > 0 || tweets.length > 0) && (
            <div className="text-sm text-gray-500 !mr-2">
              {users.length} users found, {tweets.length} tweets found
            </div>
          )}
        </div>
      </form>
      <div className="allResults !mt-4">
        {users.length === 0 && tweets.length === 0 && text.length !== 0 ? (
          <h1 className="text-gray-500 text-center !mt-10">No results found</h1>
        ) : (
          <>
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
                  />
                ))}
                {hasMoreTweets && tweets.length > 0 && (
                  <button
                    onClick={loadMoreTweets}
                    className="!w-full text-center !my-10 showMore"
                  >
                    Show More Tweets
                  </button>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

export default SearchArea;
