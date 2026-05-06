/**
 * AES key generation and encryption using SubtleCrypto only.
 *
 * No third-party crypto libraries. All operations are browser-native.
 */

import { toHex, toBase64 } from "./encoding";
import { getRandomBytes } from "./random";

const AES_ALGORITHM = "AES-GCM";
const IV_LENGTH_BYTES = 12; // 96-bit IV is optimal for AES-GCM

/**
 * Generates an AES key of the given bit length using SubtleCrypto.
 *
 * @param bits - Key size: 128, 192, or 256 bits.
 */
export async function generateAESKey(bits: 128 | 192 | 256): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: AES_ALGORITHM,
      length: bits,
    },
    true, // extractable so we can export it
    ["encrypt", "decrypt"],
  );
}

/**
 * Exports a CryptoKey as raw bytes.
 */
export async function exportAESKeyAsBytes(key: CryptoKey): Promise<Uint8Array> {
  const buffer = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(buffer);
}

/**
 * Exports a CryptoKey as a lowercase hex string.
 */
export async function exportAESKeyAsHex(key: CryptoKey): Promise<string> {
  const bytes = await exportAESKeyAsBytes(key);
  return toHex(bytes);
}

/**
 * Exports a CryptoKey as a standard base64 string (with padding).
 */
export async function exportAESKeyAsBase64(key: CryptoKey): Promise<string> {
  const bytes = await exportAESKeyAsBytes(key);
  return toBase64(bytes);
}

/**
 * Encrypts plaintext using AES-GCM with a freshly generated random IV.
 *
 * A new 96-bit IV is generated for every call — callers MUST store the IV
 * alongside the ciphertext to enable decryption.
 */
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = getRandomBytes(IV_LENGTH_BYTES);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    // Cast to avoid Uint8Array<ArrayBufferLike> vs ArrayBufferView<ArrayBuffer> mismatch
    { name: AES_ALGORITHM, iv: iv as unknown as ArrayBuffer },
    key,
    plaintext as unknown as ArrayBuffer,
  );

  return { iv, ciphertext: new Uint8Array(ciphertextBuffer) };
}

/**
 * Decrypts AES-GCM ciphertext.
 *
 * @param key        - The AES CryptoKey used during encryption.
 * @param iv         - The 96-bit IV used during encryption.
 * @param ciphertext - The ciphertext (including the 16-byte GCM authentication tag).
 */
export async function aesGcmDecrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: iv as unknown as ArrayBuffer },
    key,
    ciphertext as unknown as ArrayBuffer,
  );

  return new Uint8Array(plaintextBuffer);
}
