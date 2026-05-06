import { describe, it, expect } from "vitest";
import { generateUUIDv4, generateUUIDv7, isValidUUID } from "../uuid";

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUUIDv4", () => {
  it("matches the RFC 4122 v4 format", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateUUIDv4()).toMatch(UUID_V4_RE);
    }
  });

  it("has version bit 4 in the correct position", () => {
    const uuid = generateUUIDv4();
    // The 13th character (index 14 with dashes) is the version nibble
    const versionChar = uuid.split("-")[2]?.[0];
    expect(versionChar).toBe("4");
  });

  it("has a valid variant bit (8, 9, a, or b) in the correct position", () => {
    for (let i = 0; i < 50; i++) {
      const uuid = generateUUIDv4();
      const variantChar = uuid.split("-")[3]?.[0];
      expect(["8", "9", "a", "b"]).toContain(variantChar);
    }
  });

  it("produces 100 unique UUIDs", () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUIDv4()));
    expect(uuids.size).toBe(100);
  });
});

describe("generateUUIDv7", () => {
  it("matches the UUIDv7 format (version nibble = 7)", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateUUIDv7()).toMatch(UUID_V7_RE);
    }
  });

  it("has version bit 7 in the correct position", () => {
    const uuid = generateUUIDv7();
    const versionChar = uuid.split("-")[2]?.[0];
    expect(versionChar).toBe("7");
  });

  it("has a valid variant bit in the correct position", () => {
    for (let i = 0; i < 50; i++) {
      const uuid = generateUUIDv7();
      const variantChar = uuid.split("-")[3]?.[0];
      expect(["8", "9", "a", "b"]).toContain(variantChar);
    }
  });

  it("produces 100 unique UUIDs", () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUIDv7()));
    expect(uuids.size).toBe(100);
  });

  it("embeds a timestamp that is close to current time", () => {
    const before = Date.now();
    const uuid = generateUUIDv7();
    const after = Date.now();

    // Extract first 12 hex chars (48 bits = timestamp)
    const hexTimestamp = uuid.replace(/-/g, "").slice(0, 12);
    const embedded = parseInt(hexTimestamp, 16);

    expect(embedded).toBeGreaterThanOrEqual(before);
    expect(embedded).toBeLessThanOrEqual(after + 1);
  });
});

describe("isValidUUID", () => {
  it("accepts valid v4 UUIDs", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID(generateUUIDv4())).toBe(true);
  });

  it("accepts valid v7 UUIDs", () => {
    expect(isValidUUID(generateUUIDv7())).toBe(true);
  });

  it("rejects malformed inputs", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
    // 'g' is not a valid hex character
    expect(isValidUUID("gggggggg-gggg-4ggg-8ggg-gggggggggggg")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });
});
