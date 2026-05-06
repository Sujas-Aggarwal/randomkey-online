/**
 * Encoding helpers for key output.
 *
 * Pure transformations — no crypto, no network, no side effects.
 */

const HEX_CHARS = "0123456789abcdef";

/**
 * Encodes a Uint8Array to a lowercase hex string.
 */
export function toHex(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) {
    // Safe: byte is 0-255, so (byte >> 4) is 0-15 and (byte & 0x0f) is 0-15
    // Both are valid indices into the 16-char HEX_CHARS string.
    result += HEX_CHARS[byte >> 4]! + HEX_CHARS[byte & 0x0f]!;
  }
  return result;
}

/**
 * Decodes a hex string to a Uint8Array.
 * Throws if the input has an odd length or non-hex characters.
 */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, "");
  if (clean.length % 2 !== 0) {
    throw new Error(`fromHex: odd-length hex string (length ${clean.length})`);
  }
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("fromHex: non-hex characters in input");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array to standard base64 (with padding).
 */
export function toBase64(bytes: Uint8Array): string {
  // btoa works on binary strings
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Decodes a standard base64 string to a Uint8Array.
 */
export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array to URL-safe base64 without padding.
 * Characters: A-Z a-z 0-9 - _  (no +, /, or =)
 */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts a Uint8Array to a binary string (each byte → its char code).
 * Useful for SubtleCrypto digest input compatibility.
 */
export function bytesToBinaryString(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
}
