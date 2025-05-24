import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { connectToDatabase } from "lib/mongoose";
import { User } from "utils/models/File";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const users = await User.find({
      $or: [
        { publicKey: { $exists: false } },
        { encryptedPrivateKey: { $exists: false } },
        { iv: { $exists: false } },
        { derivedKey: { $exists: false } },
      ],
    }).select("_id username"); // Only fetch necessary fields

    return NextResponse.json({ status: "ok", users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
