import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
const { User, Tweet, Comment } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(req: Request) {
  try {
    // Get data from frontend
    const { usersToUpdate } = await req.json();

    if (
      !usersToUpdate ||
      !Array.isArray(usersToUpdate) ||
      usersToUpdate.length === 0
    ) {
      return NextResponse.json(
        { status: "error", message: "No users provided to update" },
        { status: 400 }
      );
    }

    // Update each user
    for (const userData of usersToUpdate) {
      const { _id, publicKey, encryptedPrivateKey, derivedKey, iv } = userData;

      await User.updateOne(
        { _id },
        {
          $set: {
            publicKey,
            encryptedPrivateKey,
            derivedKey,
            iv,
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        message: `Successfully updated ${usersToUpdate.length} users`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating users:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
