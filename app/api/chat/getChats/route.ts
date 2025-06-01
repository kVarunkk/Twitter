import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { Chat } from "utils/models/File";

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

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const chats = await Chat.aggregate([
      { $match: { users: objectUserId } },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$chat", "$$chatId"] },
                    { $eq: ["$isRead", false] },
                    { $ne: ["$sender", objectUserId] }, // exclude messages sent by the current user
                  ],
                },
              },
            },
          ],
          as: "unreadMessages",
        },
      },
      {
        $addFields: {
          unreadCount: { $size: "$unreadMessages" },
        },
      },
      {
        $project: {
          unreadMessages: 0, // omit the unreadMessages array
        },
      },
      {
        $sort: { unreadCount: -1, createdAt: -1 },
      },
    ]);

    // Optional: repopulate users (if needed for frontend display)
    await Chat.populate(chats, {
      path: "users",
      select: "username avatar bio followers publicKey",
    });

    return NextResponse.json({ status: "ok", chats }, { status: 200 });
  } catch (err) {
    console.error("Error fetching chats:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
