import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import moment from "moment";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Notification, Tweet, User } from "utils/models/File";
import { sendPush } from "lib/push";
import { ISerealizedUser } from "utils/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userName: string; tweetId: string }> }
) {
  try {
    await connectToDatabase();
    const { userName, tweetId } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    if (!validationResponse.user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
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

    // Check if the user already retweeted this tweet
    const existingRetweet = await Tweet.findOne({
      retweetedByUser: userName,
      retweetedFrom: originalTweetId,
    });

    if (!existingRetweet) {
      // Sync retweet state between original and all retweets
      await Tweet.updateMany(
        { $or: [{ _id: originalTweetId }, { retweetedFrom: originalTweetId }] },
        {
          $push: { retweets: userName },
        }
      );

      // Create a new retweet
      const retweet = await Tweet.create({
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

      if (tweet.postedBy !== validationResponse.user._id) {
        const sender = validationResponse.user._id;
        const recipientDB = await User.findById(tweet.postedBy);

        if (sender && recipientDB && recipientDB._id) {
          await Notification.create({
            sender: sender,
            recipient: recipientDB._id,
            type: "retweet",
            tweet: tweet._id,
          });

          // OPTIONAL: Send Web Push here if recipient has a valid pushSubscription
          if (recipientDB.pushSubscription) {
            try {
              sendPush(recipientDB as unknown as ISerealizedUser, {
                title: "New Retweet on Your Tweet",
                body: `${userName} retweeted your tweet.`,
                url: `/tweet/${retweet.postedTweetTime}`,
              });
            } catch (err) {
              console.error("Web Push Error:", err);
            }
          }
        }
      }

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
