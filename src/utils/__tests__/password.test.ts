import { describe, it, expect } from "vitest";
import {
  generatePassword,
  generatePIN,
  generateLettersOnly,
  generateNoSymbols,
  generatePassphrase,
  generatePronounceablePassword,
  CHARSETS,
} from "../password";
import type { PasswordOptions, PassphraseOptions } from "../password";

const baseOpts: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
};

describe("generatePassword", () => {
  it("returns a string of the requested length", () => {
    for (const length of [8, 12, 16, 24, 32, 64]) {
      const result = generatePassword({ ...baseOpts, length });
      expect(result.length).toBe(length);
    }
  });

  it("includes at least 1 uppercase char when enabled", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...baseOpts, length: 10, uppercase: true });
      expect([...pw].some((c) => CHARSETS.uppercase.includes(c))).toBe(true);
    }
  });

  it("includes at least 1 lowercase char when enabled", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...baseOpts, length: 10, lowercase: true });
      expect([...pw].some((c) => CHARSETS.lowercase.includes(c))).toBe(true);
    }
  });

  it("includes at least 1 digit when enabled", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...baseOpts, length: 10, digits: true });
      expect([...pw].some((c) => CHARSETS.digits.includes(c))).toBe(true);
    }
  });

  it("includes at least 1 symbol when enabled", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...baseOpts, length: 10, symbols: true });
      expect([...pw].some((c) => CHARSETS.symbols.includes(c))).toBe(true);
    }
  });

  it("contains no lowercase when uppercase-only", () => {
    const opts: PasswordOptions = {
      length: 20,
      uppercase: true,
      lowercase: false,
      digits: false,
      symbols: false,
    };
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(opts);
      expect([...pw].every((c) => CHARSETS.uppercase.includes(c))).toBe(true);
    }
  });

  it("contains no symbols when symbols disabled", () => {
    const opts: PasswordOptions = {
      length: 20,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: false,
    };
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(opts);
      expect([...pw].every((c) => !CHARSETS.symbols.includes(c))).toBe(true);
    }
  });

  it("throws when no charset is enabled", () => {
    const opts: PasswordOptions = {
      length: 10,
      uppercase: false,
      lowercase: false,
      digits: false,
      symbols: false,
    };
    expect(() => generatePassword(opts)).toThrow();
  });

  it("throws when length < number of enabled charsets", () => {
    const opts: PasswordOptions = {
      length: 1, // only 1 char for 4 enabled charsets
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
    };
    expect(() => generatePassword(opts)).toThrow();
  });

  it("no two consecutive calls produce the same output (100 trials)", () => {
    const outputs = new Set<string>();
    for (let i = 0; i < 100; i++) {
      outputs.add(generatePassword({ ...baseOpts, length: 16 }));
    }
    // Astronomically unlikely to have duplicates in 100 16-char passwords
    expect(outputs.size).toBeGreaterThan(98);
  });

  it("uses custom symbols when provided", () => {
    const custom = "!@";
    const opts: PasswordOptions = {
      length: 20,
      uppercase: false,
      lowercase: false,
      digits: false,
      symbols: true,
      customSymbols: custom,
    };
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword(opts);
      expect([...pw].every((c) => custom.includes(c))).toBe(true);
    }
  });
});

describe("generatePIN", () => {
  it("returns a string of the correct length", () => {
    for (const length of [4, 6, 8, 10] as const) {
      expect(generatePIN(length)).toHaveLength(length);
    }
  });

  it("contains only digits", () => {
    for (const length of [4, 6, 8, 10] as const) {
      const pin = generatePIN(length);
      expect(pin).toMatch(/^[0-9]+$/);
    }
  });

  it("produces variety across 100 calls", () => {
    const pins = new Set(Array.from({ length: 100 }, () => generatePIN(6)));
    expect(pins.size).toBeGreaterThan(90);
  });
});

describe("generateLettersOnly", () => {
  it("returns correct length", () => {
    expect(generateLettersOnly(12)).toHaveLength(12);
  });

  it("contains only letters", () => {
    const pw = generateLettersOnly(32);
    expect(pw).toMatch(/^[A-Za-z]+$/);
  });
});

describe("generateNoSymbols", () => {
  it("returns correct length", () => {
    expect(generateNoSymbols(12)).toHaveLength(12);
  });

  it("contains only letters and digits", () => {
    const pw = generateNoSymbols(32);
    expect(pw).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe("generatePassphrase", () => {
  const words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel"];

  it("returns a string with the correct word count (separated by separator)", () => {
    const opts: PassphraseOptions = {
      wordCount: 4,
      separator: "-",
      capitalize: false,
      includeNumber: false,
    };
    const phrase = generatePassphrase(words, opts);
    const parts = phrase.split("-");
    expect(parts.length).toBe(4);
  });

  it("capitalizes words when capitalize=true", () => {
    const opts: PassphraseOptions = {
      wordCount: 5,
      separator: " ",
      capitalize: true,
      includeNumber: false,
    };
    const phrase = generatePassphrase(words, opts);
    const parts = phrase.split(" ");
    for (const part of parts) {
      expect(part[0]).toMatch(/[A-Z]/);
    }
  });

  it("includes a digit when includeNumber=true", () => {
    const opts: PassphraseOptions = {
      wordCount: 4,
      separator: "-",
      capitalize: false,
      includeNumber: true,
    };
    // Run multiple times to overcome random digit placement
    let hasDigit = false;
    for (let i = 0; i < 10; i++) {
      if (/\d/.test(generatePassphrase(words, opts))) {
        hasDigit = true;
        break;
      }
    }
    expect(hasDigit).toBe(true);
  });

  it("only uses words from the provided list", () => {
    const opts: PassphraseOptions = {
      wordCount: 20,
      separator: " ",
      capitalize: false,
      includeNumber: false,
    };
    const phrase = generatePassphrase(words, opts);
    for (const part of phrase.split(" ")) {
      expect(words).toContain(part.toLowerCase());
    }
  });

  it("throws on empty word list", () => {
    expect(() =>
      generatePassphrase([], { wordCount: 3, separator: "-", capitalize: false, includeNumber: false }),
    ).toThrow();
  });

  it("throws when wordCount < 1", () => {
    expect(() =>
      generatePassphrase(words, { wordCount: 0, separator: "-", capitalize: false, includeNumber: false }),
    ).toThrow();
  });
});

describe("generatePronounceablePassword", () => {
  it("returns correct length", () => {
    for (const len of [4, 8, 12, 16]) {
      expect(generatePronounceablePassword(len)).toHaveLength(len);
    }
  });

  it("alternates consonants and vowels", () => {
    const VOWELS = new Set([..."aeiou"]);
    const CONSONANTS = new Set([..."bcdfghjklmnpqrstvwxyz"]);
    for (let i = 0; i < 10; i++) {
      const pw = generatePronounceablePassword(10);
      for (let idx = 0; idx < pw.length; idx++) {
        const char = pw[idx] as string;
        if (idx % 2 === 0) {
          expect(CONSONANTS.has(char)).toBe(true);
        } else {
          expect(VOWELS.has(char)).toBe(true);
        }
      }
    }
  });

  it("throws on length < 1", () => {
    expect(() => generatePronounceablePassword(0)).toThrow();
  });
});
