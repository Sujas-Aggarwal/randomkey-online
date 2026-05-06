/**
 * Password generation primitives.
 *
 * This module is the single implementation used by ALL password tool variants.
 * Math.random() is NEVER used — all randomness comes from random.ts.
 */

import { getRandomInt, randomChoice, shuffleArray } from "./random";
import type { PasswordOptions } from "./entropy";

// Re-export for consumers that only import from this module
export type { PasswordOptions };

// ---------------------------------------------------------------------------
// Character sets
// ---------------------------------------------------------------------------

export const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  similar: "0O1lI",
  ambiguous: "{}[]()/\\'\"`,;:.<>",
} as const;

// ---------------------------------------------------------------------------
// Core password generator
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random password according to `opts`.
 *
 * Guarantees at least 1 character from each enabled charset by:
 *  1. Picking one mandatory character from each enabled pool.
 *  2. Filling the remainder from the combined pool.
 *  3. Shuffling the result with Fisher-Yates (crypto RNG).
 *
 * This eliminates rejection loops while maintaining uniform distribution
 * within the constraint.
 */
export function generatePassword(opts: PasswordOptions): string {
  const { length, uppercase, lowercase, digits, symbols, customSymbols } = opts;

  const symbolSet =
    symbols && customSymbols && customSymbols.length > 0 ? customSymbols : CHARSETS.symbols;

  // Build enabled pool strings
  const pools: string[] = [];
  if (uppercase) pools.push(CHARSETS.uppercase);
  if (lowercase) pools.push(CHARSETS.lowercase);
  if (digits) pools.push(CHARSETS.digits);
  if (symbols) pools.push(symbolSet);

  if (pools.length === 0) {
    throw new Error("generatePassword: at least one character class must be enabled");
  }

  const combined = pools.join("");

  if (length < pools.length) {
    throw new Error(
      `generatePassword: length (${length}) must be >= number of enabled charsets (${pools.length})`,
    );
  }

  // Step 1 — one mandatory char from each enabled pool
  const mandatory: string[] = pools.map((pool) => {
    const idx = getRandomInt(0, pool.length);
    return pool[idx] as string;
  });

  // Step 2 — fill remaining slots from combined pool
  const remaining: string[] = [];
  for (let i = mandatory.length; i < length; i++) {
    const idx = getRandomInt(0, combined.length);
    remaining.push(combined[idx] as string);
  }

  // Step 3 — shuffle everything together
  const all = shuffleArray([...mandatory, ...remaining]);
  return all.join("");
}

// ---------------------------------------------------------------------------
// Specialty variants
// ---------------------------------------------------------------------------

/**
 * Generates a numeric PIN of the specified length.
 */
export function generatePIN(length: 4 | 6 | 8 | 10): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += getRandomInt(0, 10).toString();
  }
  return result;
}

/**
 * Generates a password composed of letters only (uppercase + lowercase).
 */
export function generateLettersOnly(length: number): string {
  return generatePassword({
    length,
    uppercase: true,
    lowercase: true,
    digits: false,
    symbols: false,
  });
}

/**
 * Generates a password with letters and digits but no symbols.
 */
export function generateNoSymbols(length: number): string {
  return generatePassword({
    length,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: false,
  });
}

// ---------------------------------------------------------------------------
// Passphrase
// ---------------------------------------------------------------------------

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

/**
 * Generates a passphrase from the provided word list.
 *
 * The word list is passed in — it is NOT hardcoded here.
 * See src/data/wordlist.ts for the EFF large wordlist.
 */
export function generatePassphrase(
  words: readonly string[],
  opts: PassphraseOptions,
): string {
  if (words.length === 0) {
    throw new Error("generatePassphrase: word list must not be empty");
  }
  if (opts.wordCount < 1) {
    throw new Error("generatePassphrase: wordCount must be >= 1");
  }

  const chosen: string[] = [];
  for (let i = 0; i < opts.wordCount; i++) {
    const idx = getRandomInt(0, words.length);
    const word = words[idx] as string;
    chosen.push(opts.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word);
  }

  if (opts.includeNumber) {
    // Insert a random digit at a random position
    const digit = getRandomInt(0, 10).toString();
    const insertAt = getRandomInt(0, chosen.length + 1);
    chosen.splice(insertAt, 0, digit);
  }

  return chosen.join(opts.separator);
}

// ---------------------------------------------------------------------------
// Pronounceable password
// ---------------------------------------------------------------------------

const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const VOWELS = "aeiou";

/**
 * Generates a pronounceable password using consonant-vowel alternation.
 *
 * Odd positions → consonant, even positions → vowel (or vice versa for odd length).
 * Uses crypto RNG throughout.
 */
export function generatePronounceablePassword(length: number): string {
  if (length < 1) {
    throw new Error("generatePronounceablePassword: length must be >= 1");
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      result += randomChoice([...CONSONANTS]);
    } else {
      result += randomChoice([...VOWELS]);
    }
  }
  return result;
}
