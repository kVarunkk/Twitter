import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "lib/auth";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { getAggregatePipeline } from "lib/aggregatePipelines";
import { connectToDatabase } from "lib/mongoose";
import { IPopulatedTweet } from "utils/types";
import { Tweet } from "utils/models/File";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { status: "error", message: "Missing query" },
        { status: 400 }
      );
    }
    const pipeline = getAggregatePipeline("tweets", query);

    const results: IPopulatedTweet[] = await Tweet.aggregate(pipeline);

    if (!results || results.length === 0) {
      return NextResponse.json({ status: "ok", results: [] });
    }

    const filteredResults = results.map((tweet) => {
      tweet.likeTweetBtn = tweet.likes.includes(user.username)
        ? "deeppink"
        : "black";
      tweet.retweetBtn = tweet.retweets.includes(user.username)
        ? "green"
        : "black";
      tweet.comments.forEach((comment) => {
        if (comment.likes) {
          comment.likeCommentBtn = comment.likes.includes(user.username)
            ? "deeppink"
            : "black";
        }
      });
      return tweet;
    });
    // .filter((_) => _.isRetweeted === false);

    return NextResponse.json({ status: "ok", results: filteredResults });
  } catch (err) {
    console.error("Hybrid search error:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
