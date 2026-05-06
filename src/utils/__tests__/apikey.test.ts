import { describe, it, expect } from "vitest";
import { generateAPIKey, generateJWTSecret, generateHMACKey } from "../apikey";

describe("generateAPIKey", () => {
  it("includes the prefix when provided", () => {
    const key = generateAPIKey({ prefix: "sk-", length: 32 });
    expect(key.startsWith("sk-")).toBe(true);
  });

  it("works with no options (defaults)", () => {
    const key = generateAPIKey();
    expect(key.length).toBeGreaterThan(0);
    // Default is base64url, no +/= chars
    expect(key).not.toContain("+");
    expect(key).not.toContain("/");
    expect(key).not.toContain("=");
  });

  it("hex encoding produces correct length", () => {
    // 32 bytes = 64 hex chars
    const key = generateAPIKey({ length: 32, encoding: "hex" });
    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it("base64url encoding contains only URL-safe chars", () => {
    const key = generateAPIKey({ length: 32, encoding: "base64url" });
    expect(key).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("base64 encoding contains standard base64 chars", () => {
    const key = generateAPIKey({ length: 32, encoding: "base64" });
    expect(key).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("prefix + hex encoding works correctly", () => {
    const key = generateAPIKey({ prefix: "pk_live_", length: 32, encoding: "hex" });
    expect(key.startsWith("pk_live_")).toBe(true);
    const suffix = key.slice("pk_live_".length);
    expect(suffix).toHaveLength(64);
    expect(suffix).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different values on repeated calls", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateAPIKey({ length: 32 })));
    expect(keys.size).toBe(50);
  });

  it("respects the length option for varying entropy sizes", () => {
    // 16 bytes in hex = 32 chars
    const k16 = generateAPIKey({ length: 16, encoding: "hex" });
    expect(k16).toHaveLength(32);

    // 64 bytes in hex = 128 chars
    const k64 = generateAPIKey({ length: 64, encoding: "hex" });
    expect(k64).toHaveLength(128);
  });
});

describe("generateJWTSecret", () => {
  it("defaults to 256-bit secret in base64url", () => {
    const secret = generateJWTSecret();
    // 32 bytes in base64url ≈ 43 chars (no padding)
    expect(secret.length).toBeGreaterThanOrEqual(42);
    expect(secret.length).toBeLessThanOrEqual(44);
    expect(secret).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("256-bit hex secret has 64 hex chars", () => {
    const secret = generateJWTSecret({ bits: 256, encoding: "hex" });
    expect(secret).toHaveLength(64);
    expect(secret).toMatch(/^[0-9a-f]+$/);
  });

  it("384-bit hex secret has 96 hex chars", () => {
    const secret = generateJWTSecret({ bits: 384, encoding: "hex" });
    expect(secret).toHaveLength(96);
  });

  it("512-bit hex secret has 128 hex chars", () => {
    const secret = generateJWTSecret({ bits: 512, encoding: "hex" });
    expect(secret).toHaveLength(128);
  });

  it("produces different secrets on repeated calls", () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateJWTSecret()));
    expect(secrets.size).toBe(50);
  });
});

describe("generateHMACKey", () => {
  it("returns a 64-char hex string for 256-bit key", async () => {
    const key = await generateHMACKey(256);
    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it("returns a 96-char hex string for 384-bit key", async () => {
    const key = await generateHMACKey(384);
    expect(key).toHaveLength(96);
  });

  it("returns a 128-char hex string for 512-bit key", async () => {
    const key = await generateHMACKey(512);
    expect(key).toHaveLength(128);
  });

  it("defaults to 256-bit key", async () => {
    const key = await generateHMACKey();
    expect(key).toHaveLength(64);
  });

  it("produces different keys on repeated calls", async () => {
    const keys = await Promise.all(Array.from({ length: 20 }, () => generateHMACKey(256)));
    const unique = new Set(keys);
    expect(unique.size).toBe(20);
  });
});
