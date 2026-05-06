import { describe, it, expect } from "vitest";
import { generateSalt, generateSaltBytes, bcryptSalt } from "../salt";

describe("generateSalt", () => {
  it("returns a lowercase hex string", () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]+$/);
  });

  it("default length produces 64 hex chars (32 bytes)", () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(64);
  });

  it("respects a custom byte count", () => {
    expect(generateSalt(16)).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(generateSalt(64)).toHaveLength(128); // 64 bytes = 128 hex chars
  });

  it("produces different values on repeated calls", () => {
    const salts = new Set(Array.from({ length: 50 }, () => generateSalt()));
    expect(salts.size).toBe(50);
  });
});

describe("generateSaltBytes", () => {
  it("returns a Uint8Array", () => {
    expect(generateSaltBytes()).toBeInstanceOf(Uint8Array);
  });

  it("default length is 32 bytes", () => {
    expect(generateSaltBytes().length).toBe(32);
  });

  it("respects custom byte count", () => {
    expect(generateSaltBytes(16).length).toBe(16);
    expect(generateSaltBytes(64).length).toBe(64);
  });

  it("produces different values on repeated calls", () => {
    const a = generateSaltBytes();
    const b = generateSaltBytes();
    expect(a).not.toEqual(b);
  });
});

describe("bcryptSalt", () => {
  it("starts with $2b$12$", () => {
    const salt = bcryptSalt();
    expect(salt.startsWith("$2b$12$")).toBe(true);
  });

  it("has the correct total length ($2b$12$ + 22 chars = 29)", () => {
    const salt = bcryptSalt();
    expect(salt).toHaveLength(29);
  });

  it("the random part (22 chars) contains only URL-safe base64 characters", () => {
    const salt = bcryptSalt();
    const randomPart = salt.slice("$2b$12$".length);
    expect(randomPart).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("produces different salts on repeated calls", () => {
    const salts = new Set(Array.from({ length: 50 }, () => bcryptSalt()));
    expect(salts.size).toBe(50);
  });
});
