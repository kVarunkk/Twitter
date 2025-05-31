import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Message, Notification, User } from "utils/models/File";
import { sendPush } from "lib/push";
import { ISerealizedUser } from "utils/types";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
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

    const { message, nonActiveUserId } = await req.json();

    const {
      roomId,
      sender,
      encryptedAESKeyForRecipient,
      encryptedAESKeyForSender,
      encryptedMessage,
      iv,
    } = message;

    if (
      !roomId ||
      !sender ||
      !encryptedAESKeyForRecipient ||
      !encryptedAESKeyForSender ||
      !encryptedMessage ||
      !iv
    ) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMessage = new Message({
      chat: roomId,
      sender,
      encryptedAESKeyForSender,
      encryptedAESKeyForRecipient,
      encryptedMessage,
      iv,
      timestamp: new Date(),
    });

    await newMessage.save();

    // 🔔 Create notification (don't notify user if they liked their own tweet)

    const recipient = nonActiveUserId;
    const recipientDB = await User.findOne({
      _id: recipient,
    });
    if (sender && recipientDB && recipientDB._id) {
      await Notification.create({
        sender: sender,
        recipient: recipientDB._id,
        type: "message",
        message: newMessage._id,
        chat: roomId,
      });

      // OPTIONAL: Send Web Push here if recipient has a valid pushSubscription
      if (recipientDB.pushSubscription) {
        try {
          sendPush(recipientDB as unknown as ISerealizedUser, {
            title: "New Message received",
            body: `${validationResponse.user.username} sent you a Message.`,
            url: `/feed`,
          });
        } catch (err) {
          console.error("Web Push Error:", err);
        }
      }
    }

    return NextResponse.json({ status: "ok", newMessage }, { status: 201 });
  } catch (err) {
    console.error("Error saving message:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
