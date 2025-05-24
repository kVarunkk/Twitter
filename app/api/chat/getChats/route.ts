import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Chat } from "utils/models/File";
import { IPopulatedChat } from "utils/types";

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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "User ID is required" },
        { status: 400 }
      );
    }

    const chats = await Chat.find({ users: { $in: [userId] } })
      .populate("users", "username avatar bio followers publicKey")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ status: "ok", chats }, { status: 200 });
  } catch (err) {
    console.error("Error fetching chats:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
