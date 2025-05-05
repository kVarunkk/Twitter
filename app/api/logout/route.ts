// app/api/logout/route.ts
import { removeTokenCookie } from "lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });

  // Remove the JWT cookie
  removeTokenCookie(response);

  return response;
}
