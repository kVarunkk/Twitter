import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI, serializeObject } from "utils/utils";
import { validateToken } from "lib/auth";

import moment from "moment";
import { connectToDatabase } from "lib/mongoose";
import { IPopulatedNotification, IPopulatedTweet, ITweet } from "utils/types";
import { Notification, Tweet, User } from "utils/models/File";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

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
    // Fetch notifications
    const notifications = await Notification.find({
      recipient: user._id,
      isRead: false,
    }).lean<IPopulatedNotification[]>();

    return NextResponse.json({
      status: "ok",
      notifications: notifications ? notifications.length : 0,
      activeUser: user.username,
      activeUserId: user._id,
    });
  } catch (error) {
    console.error("Error fetching Notifications:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
