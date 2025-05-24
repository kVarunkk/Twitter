import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Tweet, User } from "utils/models/File";
import { JWT_SECRET, MONGODB_URI } from "utils/utils";
import { setTokenCookie, signJwt } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await req.json();

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { status: "error", message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate a JWT token
    const payload = { id: user._id.toString(), username: user.username };
    const token = await signJwt(payload);

    // Return the token and success status
    const response = NextResponse.json({
      status: "ok",
      // token,
      user,
    });
    setTokenCookie(response, token);
    return response;
  } catch (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
