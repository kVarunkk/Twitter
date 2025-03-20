"use client";

import React, { useState, useContext } from "react";
import Usercard from "./Usercard";
import { UrlContext } from "../context/urlContext";
const axios = require("axios");
import "../app/globals.css";
import Header from "./Header";

function SearchArea() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const url = useContext(UrlContext);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (text.trim().length === 0) return;

    const req = await fetch(`${e.target.action}`, {
      headers: {
        "x-access-token": localStorage.getItem("token"),
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      setUsers(data.users);
    } else console.log(data.error);
  };

  return (
    <div className="HeaderAndFeed">
      <Header />
      <form
        className="search-form"
        onSubmit={handleSubmit}
        method="GET"
        action={`${url}/search/${text}`}
      >
        <input
          autoFocus
          placeholder="Search users..."
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
          {users.length > 0 && (
            <div className="text-sm text-gray-500 !mr-2">
              {users.length} users found
            </div>
          )}
        </div>
      </form>
      <div className="allUsers !mt-4">
        {users.length === 0 && text.length !== 0 ? (
          <h1 className="text-gray-500 text-center !mt-10">No user found </h1>
        ) : (
          users.map((user) => {
            return (
              <Usercard
                key={user._id}
                avatar={user.avatar}
                username={user.username}
                followers={user.followers}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default SearchArea;
