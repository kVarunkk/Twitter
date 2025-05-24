import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Comment, Tweet } from "utils/models/File";

// Ensure Mongoose connection is established

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectToDatabase();
    const { commentId } = await params;

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    // Find and delete the comment by its unique identifier (_id)
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return NextResponse.json(
        { status: "error", message: "Comment not found" },
        { status: 404 }
      );
    }

    // Remove the comment from the original tweet and all its retweets
    await Tweet.updateMany(
      { comments: commentId },
      { $pull: { comments: commentId } }
    );

    return NextResponse.json({
      status: "ok",
      message: "Comment deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
