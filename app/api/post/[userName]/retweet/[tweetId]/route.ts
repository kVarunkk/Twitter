import { NextResponse } from "next/server";
import mongoose from "mongoose";
import moment from "moment";
import { MONGODB_URI, validateToken } from "utils/utils";
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
    const userIndex = tweet.retweets.indexOf(userName);

    if (userIndex === -1) {
      // RETWEET: Only allowed if the tweet is an original tweet
      if (tweet.isRetweeted) {
        return NextResponse.json(
          {
            status: "error",
            message: "Cannot retweet a retweeted tweet",
          },
          { status: 400 }
        );
      }

      // Create a new retweet
      const newTweet = await Tweet.create({
        content: tweet.content,
        postedBy: tweet.postedBy,
        likes: tweet.likes,
        retweets: [...tweet.retweets, userName],
        tag: tweet.tag,
        likeTweetBtn: tweet.likeTweetBtn,
        retweetBtn: "green", // Change the retweet button color
        image: tweet.image,
        comments: tweet.comments,
        isEdited: tweet.isEdited,
        postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
        retweetedFrom: originalTweetId, // Reference to the original tweet
        isRetweeted: true,
      });

      // Add the new retweet to the user's tweets
      const user = await User.findOne({ username: userName });
      if (user) {
        user.tweets.unshift(newTweet._id);
        await user.save();
      }

      // Update the original tweet's retweets
      await Tweet.findByIdAndUpdate(originalTweetId, {
        $push: { retweets: userName },
      });

      return NextResponse.json({
        status: "ok",
        retweetCount: tweet.retweets.length + 1,
        retweetBtn: "green",
      });
    } else {
      // UN-RETWEET: Allowed for both original and retweeted tweets
      const retweetedTweet = await Tweet.findOneAndDelete({
        retweetedFrom: originalTweetId,
        postedBy: validationResponse.user.id,
      });

      if (retweetedTweet) {
        // Remove the user from the original tweet's retweets
        await Tweet.findByIdAndUpdate(originalTweetId, {
          $pull: { retweets: userName },
        });

        // Remove the retweet from the user's tweets
        const user = await User.findOne({ username: userName });
        if (user) {
          user.tweets = user.tweets.filter(
            (tweetId) => tweetId.toString() !== retweetedTweet._id.toString()
          );
          await user.save();
        }

        return NextResponse.json({
          status: "ok",
          retweetCount: tweet.retweets.length - 1,
          retweetBtn: "black",
        });
      }
    }
  } catch (err) {
    console.error("Error handling retweet:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
