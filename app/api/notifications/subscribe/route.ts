import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { User } from "utils/models/File";

export async function POST(req: NextRequest) {
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

    const subscription = await req.json();

    if (!validationResponse.user) throw new Error("User not found.");

    const user = await User.findById(validationResponse.user._id);

    // Only update if pushSubscription doesn't already exist
    if (!user?.pushSubscription || !user.pushSubscription.endpoint) {
      await User.findByIdAndUpdate(validationResponse.user._id, {
        pushSubscription: subscription,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
