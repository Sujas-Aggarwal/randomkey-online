/**
 * UUID generation using WebCrypto only.
 *
 * Implements RFC 4122 v4 (random) and the 2023 UUIDv7 draft (time-ordered).
 * Math.random() is never used.
 */

import { getRandomBytes } from "./random";

/**
 * Generates a RFC 4122 version 4 (random) UUID.
 *
 * Uses crypto.randomUUID() when available (Chrome 92+, Node 19+),
 * falling back to manual WebCrypto construction.
 */
export function generateUUIDv4(): string {
  // Prefer the native implementation when available — it is spec-compliant
  // and may be hardware-accelerated.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback: manually construct v4 UUID from random bytes
  const bytes = getRandomBytes(16);

  // Set version bits: version 4 → bits 12-15 of byte 6 = 0100
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x40;

  // Set variant bits: RFC 4122 variant → bits 6-7 of byte 8 = 10
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

  return formatUUIDBytes(bytes);
}

/**
 * Generates a UUIDv7 (time-ordered UUID per the 2023 IETF draft).
 *
 * Layout (128 bits):
 *   [0-47]   unix_ts_ms — millisecond precision Unix timestamp
 *   [48-51]  version    — 0111 (7)
 *   [52-63]  rand_a     — 12 random bits
 *   [64-65]  variant    — 10
 *   [66-127] rand_b     — 62 random bits
 *
 * @see https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html
 */
export function generateUUIDv7(): string {
  const bytes = getRandomBytes(16);
  const nowMs = BigInt(Date.now());

  // Embed unix_ts_ms (48 bits) in the first 6 bytes (big-endian)
  bytes[0] = Number((nowMs >> 40n) & 0xffn);
  bytes[1] = Number((nowMs >> 32n) & 0xffn);
  bytes[2] = Number((nowMs >> 24n) & 0xffn);
  bytes[3] = Number((nowMs >> 16n) & 0xffn);
  bytes[4] = Number((nowMs >> 8n) & 0xffn);
  bytes[5] = Number(nowMs & 0xffn);

  // Set version 7: high nibble of byte 6 = 0111
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x70;

  // Set variant: high two bits of byte 8 = 10
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

  return formatUUIDBytes(bytes);
}

/**
 * Formats 16 raw bytes into the canonical 8-4-4-4-12 UUID string.
 */
function formatUUIDBytes(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}

/** UUID regex covering v1–v7. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if `s` is a well-formed UUID (any version, RFC 4122 variant).
 */
export function isValidUUID(s: string): boolean {
  return UUID_RE.test(s);
}
