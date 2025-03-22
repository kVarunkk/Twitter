import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { content } = await req.json();

    // Validate input
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { status: "error", message: "Content cannot be empty" },
        { status: 400 }
      );
    }

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

    // Update the comment content and mark it as edited
    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    return NextResponse.json({
      status: "ok",
      message: "Comment updated successfully",
    });
  } catch (err) {
    console.error("Error editing comment:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
