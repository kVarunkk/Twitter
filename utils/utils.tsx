import { arrayBufferToBase64 } from "./cryptoHelpers";
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

export function serializeObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const stopPropagation = <T extends React.SyntheticEvent>(
  handler?: (e: T) => void
) => {
  return (e: T) => {
    e.stopPropagation();
    handler?.(e);
  };
};

export const MONGODB_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET_KEY;
