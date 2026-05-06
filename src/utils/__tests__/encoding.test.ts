import { describe, it, expect } from "vitest";
import {
  toHex,
  fromHex,
  toBase64,
  fromBase64,
  toBase64Url,
  bytesToBinaryString,
} from "../encoding";
import { getRandomBytes } from "../random";

describe("toHex / fromHex round-trip", () => {
  it("round-trips arbitrary bytes via hex", () => {
    for (const len of [0, 1, 16, 32, 64]) {
      const original = getRandomBytes(len);
      const hex = toHex(original);
      const recovered = fromHex(hex);
      expect(recovered).toEqual(original);
    }
  });

  it("toHex produces lowercase hex only", () => {
    const bytes = new Uint8Array([0x00, 0xff, 0xab, 0xcd]);
    expect(toHex(bytes)).toMatch(/^[0-9a-f]+$/);
  });

  it("toHex of [0xde, 0xad, 0xbe, 0xef] is 'deadbeef'", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(toHex(bytes)).toBe("deadbeef");
  });

  it("fromHex('deadbeef') is [0xde, 0xad, 0xbe, 0xef]", () => {
    const bytes = fromHex("deadbeef");
    expect(bytes).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("fromHex is case-insensitive", () => {
    expect(fromHex("DEADBEEF")).toEqual(fromHex("deadbeef"));
  });

  it("fromHex throws on odd-length string", () => {
    expect(() => fromHex("abc")).toThrow();
  });

  it("fromHex throws on non-hex characters", () => {
    expect(() => fromHex("zz")).toThrow();
  });

  it("toHex of empty array is empty string", () => {
    expect(toHex(new Uint8Array(0))).toBe("");
  });

  it("fromHex of empty string is empty array", () => {
    expect(fromHex("")).toEqual(new Uint8Array(0));
  });
});

describe("toBase64 / fromBase64 round-trip", () => {
  it("round-trips arbitrary bytes via base64", () => {
    for (const len of [0, 1, 15, 16, 17, 32, 63, 64, 65]) {
      const original = getRandomBytes(len);
      const b64 = toBase64(original);
      const recovered = fromBase64(b64);
      expect(recovered).toEqual(original);
    }
  });

  it("toBase64 of [0,0,0] is 'AAAA'", () => {
    expect(toBase64(new Uint8Array([0, 0, 0]))).toBe("AAAA");
  });

  it("fromBase64 of 'AAAA' is [0,0,0]", () => {
    expect(fromBase64("AAAA")).toEqual(new Uint8Array([0, 0, 0]));
  });
});

describe("toBase64Url", () => {
  it("contains no +, /, or = characters", () => {
    for (let i = 0; i < 100; i++) {
      const bytes = getRandomBytes(32);
      const encoded = toBase64Url(bytes);
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
    }
  });

  it("contains only URL-safe characters", () => {
    for (let i = 0; i < 50; i++) {
      const bytes = getRandomBytes(32);
      const encoded = toBase64Url(bytes);
      expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
    }
  });

  it("empty bytes produces empty string", () => {
    expect(toBase64Url(new Uint8Array(0))).toBe("");
  });
});

describe("bytesToBinaryString", () => {
  it("converts bytes to binary string", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(bytesToBinaryString(bytes)).toBe("Hello");
  });

  it("handles empty input", () => {
    expect(bytesToBinaryString(new Uint8Array(0))).toBe("");
  });

  it("produces a string of the same length as input", () => {
    const bytes = getRandomBytes(100);
    expect(bytesToBinaryString(bytes).length).toBe(100);
  });
});
