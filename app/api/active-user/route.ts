import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";

// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI!).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function GET(req: NextRequest) {
  try {
    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    return NextResponse.json({
      status: "ok",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
