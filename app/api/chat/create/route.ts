import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Chat } from "utils/models/File";

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

    const { user1, user2 } = await req.json();

    if (!user1 || !user2) {
      return NextResponse.json(
        { status: "error", message: "Missing user IDs" },
        { status: 400 }
      );
    }

    let chat = await Chat.findOne({ users: { $all: [user1, user2] } }).populate(
      "users",
      "username avatar bio followers publicKey"
    );

    if (!chat) {
      chat = new Chat({ users: [user1, user2] });
      await chat.save();

      // Populate users field after saving
      chat = await Chat.findById(chat._id).populate(
        "users",
        "username avatar bio followers publicKey"
      );
    }

    return NextResponse.json({ status: "ok", chat }, { status: 201 });
  } catch (err) {
    console.error("Error creating chat:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
