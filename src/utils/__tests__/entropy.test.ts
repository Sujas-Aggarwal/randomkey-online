import { describe, it, expect } from "vitest";
import {
  estimateBits,
  entropyLabel,
  entropyPercent,
  calcPasswordEntropy,
  charsetSizeForPassword,
} from "../entropy";
import type { PasswordOptions } from "../entropy";

describe("estimateBits", () => {
  it("computes log2(charsetSize^length) correctly", () => {
    // 26^8 → 8 * log2(26) ≈ 37.60 bits
    expect(estimateBits(26, 8)).toBeCloseTo(37.6, 1);

    // 94^16 → 16 * log2(94) ≈ 104.8 bits
    expect(estimateBits(94, 16)).toBeCloseTo(104.8, 0);

    // 2^128 → 128 bits exactly
    expect(estimateBits(2, 128)).toBeCloseTo(128, 5);
  });

  it("returns 0 for charsetSize 0", () => {
    expect(estimateBits(0, 10)).toBe(0);
  });

  it("returns 0 for length 0", () => {
    expect(estimateBits(62, 0)).toBe(0);
  });

  it("returns 0 when both inputs are 0", () => {
    expect(estimateBits(0, 0)).toBe(0);
  });

  it("is monotonically increasing with length", () => {
    const charset = 62;
    let prev = 0;
    for (let len = 1; len <= 20; len++) {
      const bits = estimateBits(charset, len);
      expect(bits).toBeGreaterThan(prev);
      prev = bits;
    }
  });
});

describe("entropyLabel", () => {
  it("labels < 40 bits as very-weak", () => {
    expect(entropyLabel(0)).toBe("very-weak");
    expect(entropyLabel(20)).toBe("very-weak");
    expect(entropyLabel(39)).toBe("very-weak");
  });

  it("labels [40, 60) as weak", () => {
    expect(entropyLabel(40)).toBe("weak");
    expect(entropyLabel(50)).toBe("weak");
    expect(entropyLabel(59)).toBe("weak");
  });

  it("labels [60, 80) as fair", () => {
    expect(entropyLabel(60)).toBe("fair");
    expect(entropyLabel(70)).toBe("fair");
    expect(entropyLabel(79)).toBe("fair");
  });

  it("labels [80, 120) as strong", () => {
    expect(entropyLabel(80)).toBe("strong");
    expect(entropyLabel(100)).toBe("strong");
    expect(entropyLabel(119)).toBe("strong");
  });

  it("labels >= 120 as very-strong", () => {
    expect(entropyLabel(120)).toBe("very-strong");
    expect(entropyLabel(256)).toBe("very-strong");
  });
});

describe("entropyPercent", () => {
  it("returns 0 for 0 bits", () => {
    expect(entropyPercent(0)).toBe(0);
  });

  it("returns 100 at or above max (default 128)", () => {
    expect(entropyPercent(128)).toBe(100);
    expect(entropyPercent(200)).toBe(100);
  });

  it("returns approximately 50 at half of max", () => {
    expect(entropyPercent(64)).toBe(50);
  });

  it("respects a custom max", () => {
    expect(entropyPercent(64, 256)).toBe(25);
  });

  it("never returns less than 0 or more than 100", () => {
    expect(entropyPercent(-10)).toBe(0);
    expect(entropyPercent(999)).toBe(100);
  });
});

describe("calcPasswordEntropy", () => {
  it("delegates to estimateBits correctly", () => {
    const password = "abcdefgh"; // 8 chars, charsetSize = 26
    expect(calcPasswordEntropy(password, 26)).toBeCloseTo(estimateBits(26, password.length), 5);
  });
});

describe("charsetSizeForPassword", () => {
  it("returns 26 for lowercase only", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: false,
      lowercase: true,
      digits: false,
      symbols: false,
    };
    expect(charsetSizeForPassword(opts)).toBe(26);
  });

  it("returns 52 for upper + lower", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: true,
      lowercase: true,
      digits: false,
      symbols: false,
    };
    expect(charsetSizeForPassword(opts)).toBe(52);
  });

  it("returns 62 for upper + lower + digits", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: false,
    };
    expect(charsetSizeForPassword(opts)).toBe(62);
  });

  it("accumulates default symbols (28 chars)", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
    };
    expect(charsetSizeForPassword(opts)).toBe(90);
  });

  it("uses custom symbols length when provided", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: false,
      lowercase: false,
      digits: false,
      symbols: true,
      customSymbols: "!@#$", // 4 unique chars
    };
    expect(charsetSizeForPassword(opts)).toBe(4);
  });

  it("deduplicates custom symbols", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: false,
      lowercase: false,
      digits: false,
      symbols: true,
      customSymbols: "!!!!", // 1 unique char after dedup
    };
    expect(charsetSizeForPassword(opts)).toBe(1);
  });

  it("returns 0 when no charsets are enabled", () => {
    const opts: PasswordOptions = {
      length: 12,
      uppercase: false,
      lowercase: false,
      digits: false,
      symbols: false,
    };
    expect(charsetSizeForPassword(opts)).toBe(0);
  });
});
