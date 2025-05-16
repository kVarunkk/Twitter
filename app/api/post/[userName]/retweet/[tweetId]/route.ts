import { NextResponse } from "next/server";
import mongoose from "mongoose";
import moment from "moment";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

const { User, Tweet, Comment } = require("utils/models/File");
// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userName: string; tweetId: string }> }
) {
  try {
    const { userName, tweetId } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    // Find the tweet by its unique identifier
    const tweet = await Tweet.findOne({ postedTweetTime: tweetId });
    if (!tweet) {
      return NextResponse.json(
        { status: "error", message: "Tweet not found" },
        { status: 404 }
      );
    }

    // Determine if the tweet is an original or a retweet
    const originalTweetId = tweet.retweetedFrom || tweet._id;

    // Check if the user has already retweeted the original tweet
    // const userIndex = tweet.retweets.indexOf(userName);

    // Check if the user already retweeted this tweet
    const existingRetweet = await Tweet.findOne({
      retweetedByUser: userName,
      retweetedFrom: originalTweetId,
    });

    if (!existingRetweet) {
      // RETWEET: Only allowed if the tweet is an original tweet
      // if (tweet.isRetweeted) {
      //   return NextResponse.json(
      //     {
      //       status: "error",
      //       message: "Cannot retweet a retweeted tweet",
      //     },
      //     { status: 400 }
      //   );
      // }

      // Add the new retweet to the user's tweets
      // const user = await User.findOne({ username: userName });
      // if (user) {
      //   user.tweets.unshift(newTweet._id);
      //   await user.save();
      // }

      // Update the original tweet's retweets
      // await Tweet.findByIdAndUpdate(originalTweetId, {
      //   $push: { retweets: userName },
      // });

      // Sync retweet state between original and all retweets
      await Tweet.updateMany(
        { $or: [{ _id: originalTweetId }, { retweetedFrom: originalTweetId }] },
        {
          $push: { retweets: userName },
        }
      );

      // Create a new retweet
      await Tweet.create({
        content: tweet.content,
        image: tweet.image,
        tag: tweet.tag,
        postedBy: tweet.postedBy,
        likes: tweet.likes,
        comments: tweet.comments,
        isEdited: tweet.isEdited,
        retweets: [...tweet.retweets, userName],
        postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
        retweetedFrom: originalTweetId,
        isRetweeted: true,
        retweetedByUser: userName,
      });

      return NextResponse.json({
        status: "ok",
        retweetCount: tweet.retweets.length + 1,
        retweetBtn: "green",
      });
    } else {
      // delete retweet
      await Tweet.findOneAndDelete({
        retweetedFrom: originalTweetId,
        retweetedByUser: userName,
      });
      // remove retweet from user's tweets
      // await User.findOneAndUpdate(
      //   {
      //     username: userName,
      //   },
      //   {
      //     $pull: { tweets: retweet._id },
      //   },
      //   {
      //     new: true,
      //   }
      // );
      // update original tweet's retweets
      // await Tweet.findByIdAndUpdate(
      //   originalTweetId,
      //   {
      //     $pull: { retweets: userName },
      //   },
      //   {
      //     new: true,
      //   }
      // );

      await Tweet.updateMany(
        { $or: [{ _id: originalTweetId }, { retweetedFrom: originalTweetId }] },
        { $pull: { retweets: userName } }
      );

      return NextResponse.json({
        status: "ok",
        retweetCount: tweet.retweets.length - 1,
        retweetBtn: "black",
      });
    }
  } catch (err) {
    console.error("Error handling retweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
