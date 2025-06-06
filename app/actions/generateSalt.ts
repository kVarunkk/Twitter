"use server";

import crypto from "crypto";

export async function generateSaltAction(): Promise<string> {
  const salt = crypto.randomBytes(16); // 128-bit salt
  return salt.toString("base64");
}
