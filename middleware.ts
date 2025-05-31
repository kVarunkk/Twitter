import { TOKEN_NAME, verifyJwt } from "lib/jwt";
import { NextRequest, NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const protectedRoutes = [
    "/feed",
    "/profile",
    "/topic",
    "/search",
    "/tweet",
    "/notifications",
  ];
  const { pathname } = req.nextUrl;

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = req.cookies.get(TOKEN_NAME)?.value;
    const user = token ? await verifyJwt(token) : null;
    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed",
    "/profile",
    "/profile/:path*",
    "/topic",
    "/topic/:path*",
    "/search",
    "/tweet/:path*",
    "/notifications",
  ],
};
