/**
 * Hashing utilities using SubtleCrypto (browser-native).
 *
 * NO network calls. NO third-party libraries for hashing.
 * All functions return hex-encoded strings unless noted.
 */

import { toHex } from "./encoding";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toBytes(input: string | Uint8Array): Uint8Array {
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  }
  return input;
}

async function subtleDigest(algorithm: string, input: string | Uint8Array): Promise<string> {
  const data = toBytes(input);
  const buffer = await crypto.subtle.digest(algorithm, data as unknown as ArrayBuffer);
  return toHex(new Uint8Array(buffer));
}

// ---------------------------------------------------------------------------
// Message digests
// ---------------------------------------------------------------------------

/**
 * Computes SHA-256 of the input and returns a lowercase hex string.
 */
export async function sha256(input: string | Uint8Array): Promise<string> {
  return subtleDigest("SHA-256", input);
}

/**
 * Computes SHA-512 of the input and returns a lowercase hex string.
 */
export async function sha512(input: string | Uint8Array): Promise<string> {
  return subtleDigest("SHA-512", input);
}

/**
 * Computes SHA-1 of the input and returns a lowercase hex string.
 *
 * @deprecated SHA-1 is cryptographically broken. Use only for legacy
 * compatibility (e.g. TOTP, git). Never use for new security-critical code.
 */
export async function sha1(input: string | Uint8Array): Promise<string> {
  return subtleDigest("SHA-1", input);
}

// ---------------------------------------------------------------------------
// HMAC
// ---------------------------------------------------------------------------

async function hmac(
  hashAlgorithm: "SHA-256" | "SHA-512",
  key: Uint8Array,
  data: string | Uint8Array,
): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: hashAlgorithm },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, toBytes(data) as unknown as ArrayBuffer);
  return toHex(new Uint8Array(signature));
}

/**
 * Computes HMAC-SHA-256 and returns a lowercase hex string.
 */
export async function hmacSha256(key: Uint8Array, data: string | Uint8Array): Promise<string> {
  return hmac("SHA-256", key, data);
}

/**
 * Computes HMAC-SHA-512 and returns a lowercase hex string.
 */
export async function hmacSha512(key: Uint8Array, data: string | Uint8Array): Promise<string> {
  return hmac("SHA-512", key, data);
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derives a key using PBKDF2 (HMAC-SHA-256).
 *
 * @param password   - The password to derive from.
 * @param salt       - Cryptographic salt (min 16 bytes recommended).
 * @param iterations - Iteration count (min 100 000 recommended for user passwords).
 * @param keyLen     - Output key length in bytes.
 */
export async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
  keyLen: number,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as unknown as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    keyLen * 8,
  );

  return new Uint8Array(bits);
}

/**
 * Derives key material using HKDF (HMAC-SHA-256).
 *
 * @param secret - Input key material.
 * @param salt   - Optional salt (use random bytes; can be zero-length).
 * @param info   - Context string (ASCII).
 * @param keyLen - Output key length in bytes.
 */
export async function hkdf(
  secret: Uint8Array,
  salt: Uint8Array,
  info: string,
  keyLen: number,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey("raw", secret as unknown as ArrayBuffer, "HKDF", false, ["deriveBits"]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as unknown as ArrayBuffer,
      info: new TextEncoder().encode(info) as unknown as ArrayBuffer,
    },
    baseKey,
    keyLen * 8,
  );

  return new Uint8Array(bits);
}
