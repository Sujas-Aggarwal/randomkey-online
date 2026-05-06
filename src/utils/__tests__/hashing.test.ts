import { describe, it, expect } from "vitest";
import {
  sha256,
  sha512,
  sha1,
  hmacSha256,
  hmacSha512,
  pbkdf2,
  hkdf,
} from "../hashing";

describe("sha256", () => {
  it("matches the known test vector for 'abc'", async () => {
    // SHA-256("abc") — verified against NIST FIPS 180-4 and Node.js crypto
    const result = await sha256("abc");
    expect(result).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("returns a 64-character hex string", async () => {
    const result = await sha256("hello world");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("accepts a Uint8Array input", async () => {
    const bytes = new TextEncoder().encode("abc");
    const result = await sha256(bytes);
    expect(result).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("different inputs produce different hashes", async () => {
    const a = await sha256("hello");
    const b = await sha256("world");
    expect(a).not.toBe(b);
  });
});

describe("sha512", () => {
  it("matches the known test vector for empty string", async () => {
    // SHA-512("") = cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
    const result = await sha512("");
    expect(result).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    );
  });

  it("returns a 128-character hex string", async () => {
    const result = await sha512("test");
    expect(result).toHaveLength(128);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});

describe("sha1", () => {
  it("matches the known test vector for 'abc'", async () => {
    // SHA-1("abc") = a9993e364706816aba3e25717850c26c9cd0d89d
    const result = await sha1("abc");
    expect(result).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("returns a 40-character hex string", async () => {
    const result = await sha1("hello");
    expect(result).toHaveLength(40);
  });
});

describe("hmacSha256", () => {
  it("matches a known HMAC-SHA256 test vector", async () => {
    // HMAC-SHA256(key="key", data="The quick brown fox jumps over the lazy dog")
    // = f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8
    const key = new TextEncoder().encode("key");
    const result = await hmacSha256(key, "The quick brown fox jumps over the lazy dog");
    expect(result).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });

  it("returns a 64-character hex string", async () => {
    const key = new Uint8Array(32).fill(1);
    const result = await hmacSha256(key, "test");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("different keys produce different MACs", async () => {
    const data = "same data";
    const keyA = new Uint8Array(32).fill(0xaa);
    const keyB = new Uint8Array(32).fill(0xbb);
    const a = await hmacSha256(keyA, data);
    const b = await hmacSha256(keyB, data);
    expect(a).not.toBe(b);
  });
});

describe("hmacSha512", () => {
  it("returns a 128-character hex string", async () => {
    const key = new Uint8Array(64).fill(1);
    const result = await hmacSha512(key, "test");
    expect(result).toHaveLength(128);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});

describe("pbkdf2", () => {
  it("produces output of the correct byte length", async () => {
    const salt = new Uint8Array(16).fill(0);
    const result = await pbkdf2("password", salt, 1000, 32);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("produces different output for different passwords", async () => {
    const salt = new Uint8Array(16).fill(0);
    const a = await pbkdf2("password1", salt, 1000, 32);
    const b = await pbkdf2("password2", salt, 1000, 32);
    expect(a).not.toEqual(b);
  });

  it("produces different output for different salts", async () => {
    const saltA = new Uint8Array(16).fill(0);
    const saltB = new Uint8Array(16).fill(1);
    const a = await pbkdf2("password", saltA, 1000, 32);
    const b = await pbkdf2("password", saltB, 1000, 32);
    expect(a).not.toEqual(b);
  });

  it("is deterministic for identical inputs", async () => {
    const salt = new Uint8Array(16).fill(42);
    const a = await pbkdf2("deterministic", salt, 1000, 32);
    const b = await pbkdf2("deterministic", salt, 1000, 32);
    expect(a).toEqual(b);
  });
});

describe("hkdf", () => {
  it("produces output of the correct byte length", async () => {
    const secret = new Uint8Array(32).fill(1);
    const salt = new Uint8Array(16).fill(0);
    const result = await hkdf(secret, salt, "test-context", 32);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("produces different output for different info strings", async () => {
    const secret = new Uint8Array(32).fill(1);
    const salt = new Uint8Array(16).fill(0);
    const a = await hkdf(secret, salt, "context-A", 32);
    const b = await hkdf(secret, salt, "context-B", 32);
    expect(a).not.toEqual(b);
  });

  it("is deterministic for identical inputs", async () => {
    const secret = new Uint8Array(32).fill(5);
    const salt = new Uint8Array(16).fill(5);
    const a = await hkdf(secret, salt, "info", 32);
    const b = await hkdf(secret, salt, "info", 32);
    expect(a).toEqual(b);
  });
});
