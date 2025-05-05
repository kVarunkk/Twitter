import { getTokenFromServer, verifyJwt } from "lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const protectedRoutes = ["/feed", "/profile", "/topic", "/search"];
  const { pathname } = req.nextUrl;

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getTokenFromServer();
    const user = token ? await verifyJwt(token) : null;
    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/feed", "/profile", "/topic", "/search"],
};
