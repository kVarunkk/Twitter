import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

const { Chat, Message } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(req: Request) {
  try {
    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const {
      roomId,
      sender,
      encryptedAESKeyForRecipient,
      encryptedAESKeyForSender,
      encryptedMessage,
      iv,
    } = await req.json();

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

    const message = new Message({
      chat: roomId,
      sender,
      encryptedAESKeyForSender,
      encryptedAESKeyForRecipient,
      encryptedMessage,
      iv,
      timestamp: new Date(),
    });

    await message.save();

    return NextResponse.json({ status: "ok", message }, { status: 201 });
  } catch (err) {
    console.error("Error saving message:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
