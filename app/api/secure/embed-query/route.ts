import { getTokenFromRequest } from "lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return { status: "error", message: "Unauthorized", user: null };
    }
    const body = await req.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/embed-query`,
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
      message: data?.message || "Query embedded successfully",
      data: data?.embedding || null,
    });
  } catch (err) {
    console.error("Error in /embed-query:", err);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
