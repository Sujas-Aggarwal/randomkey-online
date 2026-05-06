/**
 * API key, JWT secret, and HMAC key generation.
 *
 * All entropy comes from getRandomBytes (WebCrypto).
 * Math.random() is never used.
 */

import { getRandomBytes } from "./random";
import { toHex, toBase64Url, toBase64 } from "./encoding";

// ---------------------------------------------------------------------------
// API Key
// ---------------------------------------------------------------------------

export interface APIKeyOptions {
  /** Optional prefix, e.g. "sk-", "pk_live_" */
  prefix?: string;
  /** Bytes of entropy to generate (default 32 = 256 bits) */
  length?: number;
  /** Output encoding (default "base64url") */
  encoding?: "hex" | "base64url" | "base64";
}

/**
 * Generates a cryptographically random API key.
 *
 * @example
 *   generateAPIKey({ prefix: "sk-", length: 32, encoding: "base64url" })
 *   // → "sk-abc123..."
 */
export function generateAPIKey(opts: APIKeyOptions = {}): string {
  const { prefix = "", length = 32, encoding = "base64url" } = opts;

  const bytes = getRandomBytes(length);

  let encoded: string;
  switch (encoding) {
    case "hex":
      encoded = toHex(bytes);
      break;
    case "base64":
      encoded = toBase64(bytes);
      break;
    case "base64url":
    default:
      encoded = toBase64Url(bytes);
      break;
  }

  return prefix + encoded;
}

// ---------------------------------------------------------------------------
// JWT Secret
// ---------------------------------------------------------------------------

export interface JWTSecretOptions {
  /** Bit strength of the secret (default 256) */
  bits?: 256 | 384 | 512;
  /** Output encoding (default "base64url") */
  encoding?: "hex" | "base64url";
}

/**
 * Generates a cryptographically random JWT signing secret.
 *
 * The secret is sized to match the HMAC key recommendation for the
 * corresponding HS-xxx algorithm (HS256 → 256 bits, etc.).
 */
export function generateJWTSecret(opts: JWTSecretOptions = {}): string {
  const { bits = 256, encoding = "base64url" } = opts;
  const byteCount = bits / 8;
  const bytes = getRandomBytes(byteCount);

  return encoding === "hex" ? toHex(bytes) : toBase64Url(bytes);
}

// ---------------------------------------------------------------------------
// HMAC Key (SubtleCrypto)
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random HMAC key using SubtleCrypto,
 * then exports it as a lowercase hex string.
 *
 * @param bits - Key strength in bits (default 256).
 */
export async function generateHMACKey(bits: 256 | 384 | 512 = 256): Promise<string> {
  const hashAlgorithm =
    bits === 512 ? "SHA-512" : bits === 384 ? "SHA-384" : "SHA-256";

  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: hashAlgorithm, length: bits },
    true,
    ["sign", "verify"],
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  return toHex(new Uint8Array(exported));
}
