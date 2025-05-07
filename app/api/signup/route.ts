import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { User, Tweet, Comment } = require("utils/models/File");
const MONGODB_URI = process.env.MONGO_URI;

// Ensure Mongoose connection is established
if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI);
}

export async function POST(req: Request) {
  try {
    const {
      username,
      password,
      publicKey,
      encryptedPrivateKey,
      iv,
      derivedKey,
    } = await req.json();

    const errors: { path: string; msg: string }[] = [];

    // Validation rules
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      errors.push({
        path: "username",
        msg: "Username must contain only letters and numbers",
      });
    }

    if (username.length < 3 || username.length > 20) {
      errors.push({
        path: "username",
        msg: "Username must be between 3 and 20 characters long",
      });
    }

    if (password.length < 6) {
      errors.push({
        path: "password",
        msg: "Password must be at least 6 characters long",
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({ status: "error", errors }, { status: 400 });
    }

    // Check if the username is already taken
    const takenUsername = await User.findOne({
      username: username.toLowerCase(),
    });
    if (takenUsername) {
      return NextResponse.json(
        { status: "error", error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username: username.toLowerCase(),
      password: hashedPassword,
      avatar: `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/avatars/initial-avatar.png`,
      publicKey,
      encryptedPrivateKey,
      derivedKey,
      iv,
    });

    await newUser.save();

    return NextResponse.json(
      { status: "ok", message: "User created successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error during signup:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
