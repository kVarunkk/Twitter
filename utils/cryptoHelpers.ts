// Generate an RSA key pair (public/private)
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)))
  );
}

// Convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate a random AES-256 key
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt AES key using RSA public key
export async function encryptAESKey(
  aesKey: CryptoKey,
  recipientPublicKey: string
) {
  const exportedAESKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const publicKeyBuffer = base64ToArrayBuffer(recipientPublicKey);

  const importedPublicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  return arrayBufferToBase64(
    await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      importedPublicKey,
      exportedAESKey
    )
  );
}

// Import Private Key
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const cleanPrivateKey = privateKeyBase64.replace(/\s/g, "");
  const privateKeyBuffer = base64ToArrayBuffer(cleanPrivateKey);

  return await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

// Decrypt AES key using RSA private key
export async function decryptAESKey(
  encryptedAESKey: string,
  privateKeyBase64: string
): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(privateKeyBase64);
  const decryptedAESKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(encryptedAESKey)
  );

  return await window.crypto.subtle.importKey(
    "raw",
    decryptedAESKeyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

// Encrypt a message using AES-GCM
export async function encryptMessage(message: string, aesKey: CryptoKey) {
  const encodedMessage = new TextEncoder().encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedMessage = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedMessage
  );

  return {
    encryptedMessage: arrayBufferToBase64(encryptedMessage),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// Decrypt a message using AES-GCM
export async function decryptMessage(
  aesKey: CryptoKey,
  encryptedMessage: string,
  iv: string
): Promise<string> {
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
      aesKey,
      base64ToArrayBuffer(encryptedMessage)
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("❌ AES Decryption Failed:", error);
    throw new Error("Decryption failed. Ensure correct AES key and IV.");
  }
}

// Encrypt & Send Message (Updated)
export async function encryptAndSendMessage(
  message: string,
  senderPublicKey: string, // Added sender's public key
  recipientPublicKey: string
) {
  if (!senderPublicKey || !/^[A-Za-z0-9+/=]+$/.test(senderPublicKey)) {
    throw new Error("Invalid sender public key");
  }
  if (!recipientPublicKey || !/^[A-Za-z0-9+/=]+$/.test(recipientPublicKey)) {
    throw new Error("Invalid recipient public key");
  }

  const aesKey = await generateAESKey();
  const encryptedAESKeyForSender = await encryptAESKey(aesKey, senderPublicKey);
  const encryptedAESKeyForRecipient = await encryptAESKey(
    aesKey,
    recipientPublicKey
  );
  const { encryptedMessage, iv } = await encryptMessage(message, aesKey);

  return {
    encryptedAESKeyForSender,
    encryptedAESKeyForRecipient,
    encryptedMessage,
    iv,
  };
}

// Fetch and Decrypt Message (Updated)
export async function fetchAndDecryptMessage(
  encryptedAESKeyForSender: string,
  encryptedAESKeyForRecipient: string,
  encryptedMessage: string,
  iv: string,
  isSender: boolean // Added to determine user's role
): Promise<string> {
  try {
    const privateKeyBase64 = localStorage.getItem("privateKey");
    if (!privateKeyBase64) {
      throw new Error("Private key not found in localStorage");
    }

    // Select the appropriate encrypted AES key based on user role
    const encryptedAESKey = isSender
      ? encryptedAESKeyForSender
      : encryptedAESKeyForRecipient;
    const aesKey = await decryptAESKey(encryptedAESKey, privateKeyBase64);
    return await decryptMessage(aesKey, encryptedMessage, iv);
  } catch (error) {
    console.error("Decryption failed:", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : "No stack trace",
      inputs: {
        encryptedAESKeyLength: encryptedAESKeyForSender.length,
        encryptedMessageLength: encryptedMessage.length,
        ivLength: iv.length,
      },
    });
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Derive key from password (unchanged)
export async function deriveKeyFromPassword(
  password: string,
  salt: ArrayBuffer | Uint8Array<ArrayBuffer>
) {
  try {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const deriveParams = {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    };

    const derivedKey = await window.crypto.subtle.deriveKey(
      deriveParams,
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    return derivedKey;
  } catch (error) {
    throw error;
  }
}

// Removed redundant functions (diagnosePrivateKey, diagnosticDecryption) for simplicity
