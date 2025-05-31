import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { Notification } from "utils/models/File";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { _id } = await req.json();

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

    const updatedNotification = await Notification.findOneAndUpdate(
      {
        _id: _id,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    ).populate([
      {
        path: "sender",
        select: "username avatar", // or whatever fields you need
      },
      {
        path: "tweet",
        select: "postedTweetTime",
      },
    ]);

    return NextResponse.json({
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error updating like:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
