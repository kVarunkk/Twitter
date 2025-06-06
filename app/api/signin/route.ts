import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { connectToDatabase } from "lib/mongoose";
import { signJwt, setTokenCookie } from "lib/auth";
import { User } from "utils/models/File";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { status: "error", message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🧪 Legacy user: re-encrypt with new salt and IV
    if (!user.salt && user.derivedKey) {
      console.log(`🔁 Migrating legacy encryption for ${username}...`);

      // Step 1: Decrypt using legacy derivedKey and existing IV
      const derivedKeyRaw = Buffer.from(user.derivedKey, "base64"); // from DB
      const ivRaw = Buffer.from(user.iv, "base64");
      const encryptedPrivateKeyRaw = Buffer.from(
        user.encryptedPrivateKey,
        "base64"
      );

      const legacyKey = await crypto.webcrypto.subtle.importKey(
        "raw",
        derivedKeyRaw,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      const decryptedBuffer = await crypto.webcrypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivRaw },
        legacyKey,
        encryptedPrivateKeyRaw
      );
      const privateKey = new TextDecoder().decode(decryptedBuffer);

      // Step 2: Generate new salt and derive new key
      const newSalt = crypto.randomBytes(16);
      const newIv = crypto.randomBytes(12);

      const passwordBuffer = new TextEncoder().encode(password);
      const keyMaterial = await crypto.webcrypto.subtle.importKey(
        "raw",
        passwordBuffer,
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const newKey = await crypto.webcrypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: newSalt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const encryptedNew = await crypto.webcrypto.subtle.encrypt(
        { name: "AES-GCM", iv: newIv },
        newKey,
        new TextEncoder().encode(privateKey)
      );

      // Step 3: Update user fields
      user.encryptedPrivateKey = Buffer.from(encryptedNew).toString("base64");
      user.iv = newIv.toString("base64");
      user.salt = newSalt.toString("base64");
      user.derivedKey = undefined; // 🚫 no longer needed
      await user.save();

      console.log(`🔐 Migrated ${username} to new encryption format`);
    }

    // Create and return JWT
    const payload = { id: user._id.toString(), username: user.username };
    const token = await signJwt(payload);

    const response = NextResponse.json({
      status: "ok",
      user, // includes salt, iv, encryptedPrivateKey
    });
    setTokenCookie(response, token);
    return response;
  } catch (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}
