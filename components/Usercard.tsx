"use client";

import { useContext } from "react";
import React from "react";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import Link from "next/link";
import Avatar from "./Avatar";

function Usercard(props) {
  const url = useContext(UrlContext);

  const CardContent = (
    <div className="hover:bg-gray-100 card border-b border-border">
      <div className="card-img">
        <Avatar
          // className="tweet-avatar"
          src={`${props.avatar}`}
          alt={`${props.username}'s avatar`}
        />
      </div>
      <div className="card-text">
        <div className="card-text-username">{props.username}</div>
        {props.bio && (
          <div className="card-text-followers text-gray-600">{props.bio}</div>
        )}
        <div className="card-text-follow">
          <div className="card-text-followers text-gray-600">
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
