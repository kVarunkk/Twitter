import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import moment from "moment";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Comment, Notification, Tweet, User } from "utils/models/File";
import { sendPush } from "lib/push";
import { ISerealizedUser } from "utils/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tweetId: string }> }
) {
  try {
    await connectToDatabase();
    const { tweetId } = await params;
    const body = await req.json();

    // Validate the token
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

    // Create a new comment
    const newComment = await Comment.create({
      content: body.content,
      postedCommentTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
      likes: [],
      likeCommentBtn: "black",
    });

    // Find the tweet by its unique identifier
    const tweet = await Tweet.findOne({ postedTweetTime: tweetId });
    if (!tweet) {
      return NextResponse.json(
        { status: "error", message: "Tweet not found" },
        { status: 404 }
      );
    }

    // Determine the original tweet (if the current tweet is a retweet)
    const originalTweetId = tweet.retweetedFrom || tweet._id;

    // Find the original tweet
    const originalTweet = await Tweet.findById(originalTweetId);
    if (!originalTweet) {
      return NextResponse.json(
        { status: "error", message: "Original tweet not found" },
        { status: 404 }
      );
    }

    // Find the user who posted the comment
    const dbUser = await User.findOne({ username: user.username });
    if (!dbUser) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Associate the comment with the user
    newComment.postedBy = dbUser._id;
    await newComment.save();

    // Add the comment to the original tweet
    originalTweet.comments.unshift(newComment._id);
    await originalTweet.save();

    // Propagate the updated comments to all retweets of the original tweet
    await Tweet.updateMany(
      { $or: [{ _id: originalTweetId }, { retweetedFrom: originalTweetId }] },
      { comments: originalTweet.comments }
    );

    // Populate the comment with user details before returning
    const populatedComment = await Comment.findById(newComment._id).populate(
      "postedBy",
      "username avatar"
    );

    if (tweet.postedBy !== user._id) {
      const sender = user._id;
      const recipientDB = await User.findById(tweet.postedBy);

      if (sender && recipientDB && recipientDB._id) {
        await Notification.create({
          sender: sender,
          recipient: recipientDB._id,
          type: "comment",
          tweet: originalTweet._id,
          comment: newComment._id,
        });

        // OPTIONAL: Send Web Push here if recipient has a valid pushSubscription
        if (recipientDB.pushSubscription) {
          try {
            sendPush(recipientDB as unknown as ISerealizedUser, {
              title: "New Reply on Your Tweet",
              body: `${user.username} replied to your tweet.`,
              url: `/tweet/${originalTweet.postedTweetTime}`,
            });
          } catch (err) {
            console.error("Web Push Error:", err);
          }
        }
      }
    }

    // Return the newly created comment and updated comment count
    return NextResponse.json({
      status: "ok",
      comment: populatedComment,
      commentCount: originalTweet.comments.length,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
