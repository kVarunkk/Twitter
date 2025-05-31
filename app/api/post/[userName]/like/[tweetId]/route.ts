import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { ITweetDocument, Notification, Tweet, User } from "utils/models/File";
import { ISerealizedUser, ITweet } from "utils/types";
import { sendPush } from "lib/push";

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
    const tweet = await Tweet.findOne({ postedTweetTime: tweetId }).populate(
      "postedBy",
      "username"
    );

    if (!tweet) {
      return NextResponse.json(
        { status: "error", message: "Tweet not found" },
        { status: 404 }
      );
    }

    // Check if the user has already liked the tweet
    const userIndex = tweet.likes.indexOf(userName);

    if (userIndex === -1) {
      // User has not liked the tweet, so add the like
      tweet.likes.push(userName);
      tweet.likeTweetBtn = "deeppink";

      // 🔔 Create notification (don't notify user if they liked their own tweet)
      if (
        (
          tweet.postedBy as unknown as {
            username: string;
          }
        ).username !== userName
      ) {
        const sender = validationResponse.user._id;
        const recipient = (
          tweet.postedBy as unknown as {
            username: string;
          }
        ).username;

        const recipientDB = await User.findOne({
          username: recipient,
        });

        if (sender && recipientDB && recipientDB._id) {
          await Notification.create({
            sender: sender,
            recipient: recipientDB._id,
            type: "like",
            tweet: tweet._id,
          });

          // OPTIONAL: Send Web Push here if recipient has a valid pushSubscription
          if (recipientDB.pushSubscription) {
            try {
              sendPush(recipientDB as unknown as ISerealizedUser, {
                title: "New Like on Your Tweet",
                body: `${userName} liked your tweet.`,
                url: `/tweet/${tweet.postedTweetTime}`,
              });
            } catch (err) {
              console.error("Web Push Error:", err);
            }
          }
        }
      }
    } else {
      // User has already liked the tweet, so remove the like
      tweet.likes.splice(userIndex, 1);
      tweet.likeTweetBtn = "black";
    }

    // Save the updated tweet
    await tweet.save();

    // Propagate the like to the original tweet and all its retweets
    const tweetIdToUpdate = tweet.retweetedFrom || tweet._id; // Use original tweet ID if it's a retweet
    await Tweet.updateMany(
      { $or: [{ _id: tweetIdToUpdate }, { retweetedFrom: tweetIdToUpdate }] },
      { likes: tweet.likes }
    );

    // Return the updated like count and button color to the frontend
    return NextResponse.json({
      status: "ok",
      likeCount: tweet.likes.length,
      likeTweetBtn: tweet.likeTweetBtn,
    });
  } catch (err) {
    console.error("Error updating like:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
