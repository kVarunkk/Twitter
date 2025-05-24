import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { User } from "utils/models/File";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userName: string }> }
) {
  try {
    await connectToDatabase();
    const { userName } = await params;
    const { field, value } = await req.json();

    // Validate input
    if (!field) {
      return NextResponse.json(
        { status: "error", message: "Field is required for profile update." },
        { status: 400 }
      );
    }

    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    if (!validationResponse.user) {
      return NextResponse.json(
        { status: "error", message: "User not found." },
        { status: 404 }
      );
    }

    // Ensure the user is updating their own profile
    if (validationResponse.user.username !== userName) {
      return NextResponse.json(
        {
          status: "error",
          message: "You are not authorized to update this profile.",
        },
        { status: 403 }
      );
    }

    // Find the user by username
    const user = await User.findOne({ username: userName });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found." },
        { status: 404 }
      );
    }

    // Update the specified field
    if (field === "banner") {
      user.banner = value;
    } else if (field === "bio") {
      user.bio = value;
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid field. Only 'banner' and 'bio' can be updated.",
        },
        { status: 400 }
      );
    }

    // Save the updated user
    await user.save();

    return NextResponse.json({
      status: "ok",
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } updated successfully.`,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error." },
      { status: 500 }
    );
  }
}
