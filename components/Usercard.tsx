"use client";

import { useContext } from "react";
import React from "react";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import Link from "next/link";

function Usercard(props) {
  const url = useContext(UrlContext);

  const CardContent = (
    <div className="hover:bg-gray-100 card border-b border-border">
      <div className="card-img">
        <img
          className="tweet-avatar"
          src={`${url}/images/${props.avatar}`}
          alt={`${props.username}'s avatar`}
        ></img>
      </div>
      <div className="card-text">
        <div className="card-text-username">{props.username}</div>
        <div className="card-text-follow">
          <div className="card-text-followers">
            {props.followers.length} followers
          </div>
        </div>
      </div>
    </div>
  );

  return props.noLink ? (
    <div className="cursor-pointer">{CardContent}</div> // Render as a non-clickable div
  ) : (
    <Link href={`/profile/${props.username}`}>{CardContent}</Link> // Render as a clickable link
  );
}

export default Usercard;
