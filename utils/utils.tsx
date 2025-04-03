import jwt from "jsonwebtoken";
import { arrayBufferToBase64 } from "./cryptoHelpers";
const { User, Tweet, Comment } = require("utils/models/File");
export const formatContentWithLinks = (content: string) => {
  // Updated regex to allow periods but exclude trailing commas and other punctuation
  const urlRegex = /(https?:\/\/[^\s,!?()]+(?:\.[^\s,!?()]+)*)/g;

  return content?.split(urlRegex)?.map((part: string, index: number) =>
    urlRegex.test(part) ? (
      <a
        onClick={(e) => {
          e.stopPropagation();
        }}
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#1DA1F2] break-all hover:underline"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

export async function validateToken(req) {
  try {
    // Get the token from the x-access-token header
    const token = req.headers.get("x-access-token");
    if (!token) {
      return { status: "error", message: "Unauthorized", user: null };
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return {
        status: "error",
        message: "Invalid or expired token",
        user: null,
      };
    }

    // Find the user associated with the token
    const user = await User.findById(decoded.id).select("username");
    if (!user) {
      return { status: "error", message: "User not found", user: null };
    }

    // Return the user if validation is successful
    return { status: "ok", message: "Token is valid", user };
  } catch (error) {
    console.error("Token validation error:", error);
    return { status: "error", message: "Invalid or expired token", user: null };
  }
}

export async function encryptPrivateKey(
  privateKey: string,
  derivedKey: CryptoKey
) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    new TextEncoder().encode(privateKey)
  );
  return {
    encryptedPrivateKey: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

export const MONGODB_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET_KEY;
