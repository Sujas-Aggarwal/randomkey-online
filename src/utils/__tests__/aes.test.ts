import { describe, it, expect } from "vitest";
import {
  generateAESKey,
  exportAESKeyAsBytes,
  exportAESKeyAsHex,
  exportAESKeyAsBase64,
  aesGcmEncrypt,
  aesGcmDecrypt,
} from "../aes";

describe("generateAESKey", () => {
  it("returns a CryptoKey with correct algorithm for 128-bit", async () => {
    const key = await generateAESKey(128);
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm.name).toBe("AES-GCM");
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(128);
    expect(key.extractable).toBe(true);
    expect(key.usages).toContain("encrypt");
    expect(key.usages).toContain("decrypt");
  });

  it("returns a CryptoKey with correct algorithm for 192-bit", async () => {
    const key = await generateAESKey(192);
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(192);
  });

  it("returns a CryptoKey with correct algorithm for 256-bit", async () => {
    const key = await generateAESKey(256);
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
  });
});

describe("exportAESKeyAsBytes", () => {
  it("returns correct byte lengths for each key size", async () => {
    for (const bits of [128, 192, 256] as const) {
      const key = await generateAESKey(bits);
      const bytes = await exportAESKeyAsBytes(key);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(bits / 8);
    }
  });
});

describe("exportAESKeyAsHex", () => {
  it("returns a hex string of correct length for each key size", async () => {
    for (const bits of [128, 192, 256] as const) {
      const key = await generateAESKey(bits);
      const hex = await exportAESKeyAsHex(key);
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex.length).toBe((bits / 8) * 2);
    }
  });
});

describe("exportAESKeyAsBase64", () => {
  it("returns a valid base64 string", async () => {
    const key = await generateAESKey(256);
    const b64 = await exportAESKeyAsBase64(key);
    expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe("AES-GCM encrypt/decrypt round-trip", () => {
  for (const bits of [128, 192, 256] as const) {
    it(`round-trips plaintext with a ${bits}-bit key`, async () => {
      const key = await generateAESKey(bits);
      const plaintext = new TextEncoder().encode("Hello, AES-GCM!");

      const { iv, ciphertext } = await aesGcmEncrypt(key, plaintext);
      const decrypted = await aesGcmDecrypt(key, iv, ciphertext);

      // Compare as arrays to avoid Vitest Uint8Array buffer-comparison quirk
      expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
    });
  }

  it("produces different IVs on each encryption call", async () => {
    const key = await generateAESKey(256);
    const plaintext = new TextEncoder().encode("same plaintext");

    const result1 = await aesGcmEncrypt(key, plaintext);
    const result2 = await aesGcmEncrypt(key, plaintext);

    // IVs must differ (extremely high probability)
    expect(result1.iv).not.toEqual(result2.iv);
  });

  it("produces different ciphertexts on each encryption call (different IVs)", async () => {
    const key = await generateAESKey(256);
    const plaintext = new TextEncoder().encode("same plaintext");

    const result1 = await aesGcmEncrypt(key, plaintext);
    const result2 = await aesGcmEncrypt(key, plaintext);

    // Ciphertexts also differ because IVs differ
    expect(result1.ciphertext).not.toEqual(result2.ciphertext);
  });

  it("IV is 12 bytes (96-bit, optimal for AES-GCM)", async () => {
    const key = await generateAESKey(256);
    const { iv } = await aesGcmEncrypt(key, new TextEncoder().encode("test"));
    expect(iv.length).toBe(12);
  });

  it("throws on decryption with wrong key", async () => {
    const key1 = await generateAESKey(256);
    const key2 = await generateAESKey(256);
    const plaintext = new TextEncoder().encode("secret");

    const { iv, ciphertext } = await aesGcmEncrypt(key1, plaintext);

    await expect(aesGcmDecrypt(key2, iv, ciphertext)).rejects.toThrow();
  });

  it("handles empty plaintext", async () => {
    const key = await generateAESKey(256);
    const plaintext = new Uint8Array(0);
    const { iv, ciphertext } = await aesGcmEncrypt(key, plaintext);
    const decrypted = await aesGcmDecrypt(key, iv, ciphertext);
    expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
  });
});
