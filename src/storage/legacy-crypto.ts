import { inflate } from "pako";
import { decode } from "@msgpack/msgpack";

const LEGACY_TYPE = "aes-gcm-self-ssm-v2";
const LEGACY_SALT = "ssm-encrypt-for-current-user-v1";
const ITERATIONS = 100000;

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("Invalid hex value");
  }

  const bytes = new Uint8Array(new ArrayBuffer(clean.length / 2));

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

export function isLegacySec(sec: unknown): sec is string {
  if (typeof sec !== "string") {
    return false;
  }

  try {
    const envelope = JSON.parse(sec);

    return (
      envelope?.type === LEGACY_TYPE &&
      typeof envelope.iv === "string" &&
      typeof envelope.encrypted === "string"
    );
  } catch {
    return false;
  }
}

export async function deriveLegacyKey(privateKeyHex: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    hexToBytes(privateKeyHex),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(LEGACY_SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

export async function decryptLegacySec(sec: string, key: CryptoKey): Promise<unknown> {
  const envelope = JSON.parse(sec);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBytes(envelope.iv) },
    key,
    hexToBytes(envelope.encrypted),
  );
  const decoded = decode(inflate(new Uint8Array(plain)));

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof (decoded as { content?: unknown }).content !== "string"
  ) {
    throw new Error("Legacy plaintext is not a note");
  }

  return decoded;
}
