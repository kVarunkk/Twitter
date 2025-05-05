import { getTokenFromRequest, verifyJwt } from "lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyJwt(token) : null;

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
