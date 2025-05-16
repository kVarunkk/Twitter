import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { JWT_SECRET } from "utils/utils";
const { User, Tweet, Comment } = require("utils/models/File");

const TOKEN_NAME = "token";
const MAX_AGE = 60 * 60 * 24; // 1 day in seconds

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signJwt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(getSecretKey());
}

// Verify JWT
export async function verifyJwt(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (e) {
    console.error("JWT verification error:", e);
    return null;
  }
}

// ✅ Get token in middleware/server component context (safe & sync)
export async function getTokenFromServer(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME);
    return token?.value || null;
  } catch {
    return null;
  }
}

// ✅ Get token from Request (in route handlers like /api/**/route.ts)
export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  const match = cookieHeader?.match(/(^|;\s*)token=([^;]+)/);
  return match?.[2] || null;
}

// ✅ Set token cookie in route response
export function setTokenCookie(response: Response, token: string): void {
  response.headers.append(
    "Set-Cookie",
    `${TOKEN_NAME}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure;" : ""
    }`
  );
}

// ✅ Remove token cookie (log out)
export function removeTokenCookie(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    `${TOKEN_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure;" : ""
    }`
  );
}

export async function validateToken(req) {
  try {
    // Get the token from the x-access-token header
    const token = getTokenFromRequest(req);
    if (!token) {
      return { status: "error", message: "Unauthorized", user: null };
    }

    // Verify the token
    const decoded = await verifyJwt(token);
    if (!decoded) {
      return {
        status: "error",
        message: "Invalid or expired token",
        user: null,
      };
    }

    // Find the user associated with the token
    const user = await User.findById(decoded.id);
    if (!user) {
      return { status: "error", message: "User not found", user: null };
    }

    // Return the user if validation is successful
    return { status: "ok", message: "Token is valid", user, token };
  } catch (error) {
    console.error("Token validation error:", error);
    return {
      status: "error",
      message: "Invalid or expired token",
      user: null,
      token: null,
    };
  }
}
