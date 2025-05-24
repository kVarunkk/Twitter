import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Message } from "utils/models/File";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { status: "error", message: "Chat ID is required" },
        { status: 400 }
      );
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username avatar")
      .sort({ timestamp: 1 });

    return NextResponse.json({ status: "ok", messages }, { status: 200 });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
