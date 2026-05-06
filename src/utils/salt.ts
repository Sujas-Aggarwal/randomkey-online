/**
 * Salt generation utilities.
 *
 * All entropy from getRandomBytes (WebCrypto). Math.random() is forbidden here.
 */

import { getRandomBytes } from "./random";
import { toHex, toBase64Url } from "./encoding";

/**
 * Generates a cryptographically random salt encoded as a lowercase hex string.
 *
 * @param bytes - Number of random bytes (default 32 = 256 bits).
 */
export function generateSalt(bytes = 32): string {
  return toHex(getRandomBytes(bytes));
}

/**
 * Generates a cryptographically random salt as a raw Uint8Array.
 *
 * @param n - Number of random bytes (default 32).
 */
export function generateSaltBytes(n = 32): Uint8Array {
  return getRandomBytes(n);
}

/**
 * Generates the random component of a bcrypt salt and formats it as a
 * `$2b$12$...` prefix string.
 *
 * IMPORTANT: This does NOT run bcrypt hashing (no bcryptjs allowed).
 * The output is a properly-formatted bcrypt salt string for documentation
 * and reference purposes. Feed this to a real bcrypt implementation to hash.
 *
 * bcrypt salt layout:
 *   $2b$12$<22 chars of base64url-ish encoded random bytes>
 *
 * bcrypt uses a custom base64 alphabet. Here we use the standard base64url
 * alphabet (close enough for illustration — real bcrypt uses its own table).
 */
export function bcryptSalt(): string {
  // bcrypt needs 16 random bytes (128 bits) for its salt component
  const randomBytes = getRandomBytes(16);
  // Encode in base64url and take first 22 chars (bcrypt truncates to 22)
  const encoded = toBase64Url(randomBytes).slice(0, 22);
  return `$2b$12$${encoded}`;
}
