// middleware runs on edge runtime which doesn't support mongoose

import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET_KEY!;
const TOKEN_NAME = "token";

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export { TOKEN_NAME };
