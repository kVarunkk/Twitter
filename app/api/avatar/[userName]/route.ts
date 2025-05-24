import { NextRequest, NextResponse } from "next/server";
import mongoose, { connect } from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { connectToDatabase } from "lib/mongoose";
import { User } from "utils/models/File";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    await connectToDatabase();
    const { userName } = await params;
    const { avatar } = await req.json();

    // Find the user by username
    const user = await User.findOne({ username: userName });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Update the user's avatar
    user.avatar = avatar;
    await user.save();

    return NextResponse.json({
      status: "ok",
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("Error updating avatar:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
