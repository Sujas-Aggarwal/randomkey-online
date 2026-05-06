import { describe, it, expect } from "vitest";
import {
  getRandomBytes,
  getRandomInt,
  getRandomFloat,
  randomChoice,
  shuffleArray,
  randomBigInt,
} from "../random";

describe("getRandomBytes", () => {
  it("returns a Uint8Array of the requested length", () => {
    expect(getRandomBytes(0)).toBeInstanceOf(Uint8Array);
    expect(getRandomBytes(0).length).toBe(0);
    expect(getRandomBytes(16).length).toBe(16);
    expect(getRandomBytes(32).length).toBe(32);
    expect(getRandomBytes(64).length).toBe(64);
  });

  it("throws on negative n", () => {
    expect(() => getRandomBytes(-1)).toThrow(RangeError);
  });

  it("throws on non-integer n", () => {
    expect(() => getRandomBytes(1.5)).toThrow(RangeError);
  });

  it("produces different values on successive calls (overwhelming probability)", () => {
    const a = getRandomBytes(32);
    const b = getRandomBytes(32);
    // The probability of collision is negligible (2^-256)
    expect(a).not.toEqual(b);
  });
});

describe("getRandomInt", () => {
  it("stays in [min, max) over 10000 samples", () => {
    const min = 5;
    const max = 15;
    for (let i = 0; i < 10_000; i++) {
      const v = getRandomInt(min, max);
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThan(max);
    }
  });

  it("returns an integer", () => {
    for (let i = 0; i < 100; i++) {
      expect(Number.isInteger(getRandomInt(0, 100))).toBe(true);
    }
  });

  it("throws when min >= max", () => {
    expect(() => getRandomInt(5, 5)).toThrow(RangeError);
    expect(() => getRandomInt(10, 5)).toThrow(RangeError);
  });

  it("throws on non-integers", () => {
    expect(() => getRandomInt(0.5, 10)).toThrow(TypeError);
    expect(() => getRandomInt(0, 10.9)).toThrow(TypeError);
  });

  it("covers the full range [min, max) over 5000 samples (no modulo bias check)", () => {
    const min = 0;
    const max = 10;
    const counts = new Array<number>(max - min).fill(0);
    const trials = 5000;

    for (let i = 0; i < trials; i++) {
      const v = getRandomInt(min, max);
      const idx = v - min;
      counts[idx] = (counts[idx] ?? 0) + 1;
    }

    // Each bin should receive roughly trials/range samples.
    // Allow ±40% tolerance to avoid flakiness.
    const expected = trials / (max - min);
    for (const count of counts) {
      expect(count).toBeGreaterThan(expected * 0.6);
      expect(count).toBeLessThan(expected * 1.4);
    }
  });

  it("works with range of 1", () => {
    expect(getRandomInt(7, 8)).toBe(7);
  });
});

describe("getRandomFloat", () => {
  it("returns a number in [0, 1)", () => {
    for (let i = 0; i < 1000; i++) {
      const v = getRandomFloat();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("returns different values on successive calls", () => {
    const values = new Set<number>();
    for (let i = 0; i < 100; i++) {
      values.add(getRandomFloat());
    }
    // Extremely unlikely to have duplicates in 100 floats
    expect(values.size).toBeGreaterThan(90);
  });
});

describe("randomChoice", () => {
  it("returns only values from the array", () => {
    const arr = ["a", "b", "c", "d", "e"] as const;
    for (let i = 0; i < 1000; i++) {
      expect(arr).toContain(randomChoice(arr));
    }
  });

  it("returns the only element when array has length 1", () => {
    expect(randomChoice(["x"])).toBe("x");
  });

  it("throws on empty array", () => {
    expect(() => randomChoice([])).toThrow(RangeError);
  });

  it("produces all values with reasonable frequency", () => {
    const arr = [1, 2, 3, 4] as const;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (let i = 0; i < 4000; i++) {
      counts[randomChoice(arr)]!++;
    }
    for (const count of Object.values(counts)) {
      // Each value should appear roughly 1000 times; allow ±40% tolerance
      expect(count).toBeGreaterThan(600);
      expect(count).toBeLessThan(1400);
    }
  });
});

describe("shuffleArray", () => {
  it("contains the same elements as the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(input);
    expect(shuffled.sort()).toEqual([...input].sort());
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it("produces different orderings over multiple calls (statistical)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const serialized = new Set<string>();
    for (let i = 0; i < 100; i++) {
      serialized.add(shuffleArray(input).join(","));
    }
    // With 10! = 3.6M possible permutations, 100 trials should produce
    // many distinct orderings. Require at least 80.
    expect(serialized.size).toBeGreaterThan(80);
  });

  it("handles empty arrays", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("handles single-element arrays", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe("randomBigInt", () => {
  it("returns a BigInt", () => {
    expect(typeof randomBigInt(64)).toBe("bigint");
  });

  it("returns a value in the range [2^(bits-1), 2^bits)", () => {
    for (const bits of [8, 16, 32, 64, 128, 256]) {
      const v = randomBigInt(bits);
      const min = 1n << BigInt(bits - 1);
      const max = 1n << BigInt(bits);
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThan(max);
    }
  });

  it("throws on non-positive bits", () => {
    expect(() => randomBigInt(0)).toThrow(RangeError);
    expect(() => randomBigInt(-1)).toThrow(RangeError);
  });

  it("throws on non-integer bits", () => {
    expect(() => randomBigInt(1.5)).toThrow(RangeError);
  });

  it("produces distinct values across calls", () => {
    const values = new Set<bigint>();
    for (let i = 0; i < 20; i++) {
      values.add(randomBigInt(128));
    }
    expect(values.size).toBeGreaterThan(18);
  });
});
