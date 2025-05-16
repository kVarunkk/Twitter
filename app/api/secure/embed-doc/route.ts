import { getTokenFromServer } from "lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromServer();

    if (!token) {
      return { status: "error", message: "Unauthorized", user: null };
    }

    const body = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/embed-doc`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: data?.detail || "Failed to get embedding" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: data?.message || "Documents embedded successfully",
    });
  } catch (err) {
    console.error("Error in /embed-doc:", err);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
