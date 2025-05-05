import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
  { params }: { params: Promise<{ userName: string; commentId: string }> }
) {
  try {
    const { userName, commentId } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    // Find the comment by its unique identifier
    const comment = await Comment.findOne({ postedCommentTime: commentId });

    if (!comment) {
      return NextResponse.json(
        { status: "error", message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the user has already liked the comment
    const userIndex = comment.likes.indexOf(userName);

    if (userIndex === -1) {
      // User has not liked the comment, so add the like
      comment.likes.push(userName);
      comment.likeCommentBtn = "deeppink";
    } else {
      // User has already liked the comment, so remove the like
      comment.likes.splice(userIndex, 1);
      comment.likeCommentBtn = "black";
    }

    // Save the updated comment
    await comment.save();

    // Return the updated like count and button color to the frontend
    return NextResponse.json({
      status: "ok",
      btnColor: comment.likeCommentBtn,
      likeCount: comment.likes.length,
    });
  } catch (err) {
    console.error("Error updating comment like:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
