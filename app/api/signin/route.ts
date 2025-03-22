import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const { User, Tweet, Comment } = require("utils/models/File");
import { JWT_SECRET, MONGODB_URI } from "utils/utils";

// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI);
}

export async function POST(req: Request) {
  try {
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
    const payload = { id: user._id, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return the token and success status
    return NextResponse.json({
      status: "ok",
      token,
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
