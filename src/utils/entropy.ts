/**
 * Entropy measurement and display utilities.
 *
 * Used to calculate and visualize the cryptographic strength of generated secrets.
 * No cryptographic operations happen here — this is pure math for UI purposes.
 */

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  customSymbols?: string;
}

export type EntropyLabel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

/**
 * Computes the theoretical entropy in bits for a randomly chosen string
 * from a charset of `charsetSize` symbols with a given `length`.
 *
 * Formula: log2(charsetSize ^ length) = length * log2(charsetSize)
 */
export function estimateBits(charsetSize: number, length: number): number {
  if (charsetSize <= 0 || length <= 0) return 0;
  return length * Math.log2(charsetSize);
}

/**
 * Maps an entropy bit count to a human-readable label for UI display.
 *
 * Thresholds:
 *   < 40 bits  → very-weak
 *   < 60 bits  → weak
 *   < 80 bits  → fair
 *   < 120 bits → strong
 *   ≥ 120 bits → very-strong
 */
export function entropyLabel(bits: number): EntropyLabel {
  if (bits < 40) return "very-weak";
  if (bits < 60) return "weak";
  if (bits < 80) return "fair";
  if (bits < 120) return "strong";
  return "very-strong";
}

/**
 * Converts an entropy bit count to a 0-100 percentage for use in a UI meter.
 *
 * @param bits   - Computed entropy bits.
 * @param max    - The bit count treated as 100% (default 128).
 */
export function entropyPercent(bits: number, max = 128): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((bits / max) * 100)));
}

/**
 * Calculates the effective entropy of a given password string, treating the
 * character pool as `charsetSize` (caller's responsibility to determine this).
 *
 * This is NOT a password strength checker — it computes theoretical maximum
 * entropy assuming random uniform selection from the pool.
 */
export function calcPasswordEntropy(password: string, charsetSize: number): number {
  return estimateBits(charsetSize, password.length);
}

/**
 * Computes the effective charset size for a password given its generation options.
 *
 * When `customSymbols` is provided and non-empty it replaces the default symbol set.
 */
export function charsetSizeForPassword(opts: PasswordOptions): number {
  const UPPERCASE_SIZE = 26;
  const LOWERCASE_SIZE = 26;
  const DIGITS_SIZE = 10;
  const DEFAULT_SYMBOLS_SIZE = 28; // matches CHARSETS.symbols in password.ts

  let size = 0;

  if (opts.uppercase) size += UPPERCASE_SIZE;
  if (opts.lowercase) size += LOWERCASE_SIZE;
  if (opts.digits) size += DIGITS_SIZE;

  if (opts.symbols) {
    if (opts.customSymbols && opts.customSymbols.length > 0) {
      // Deduplicate custom symbols to get true pool size
      size += new Set(opts.customSymbols).size;
    } else {
      size += DEFAULT_SYMBOLS_SIZE;
    }
  }

  return size;
}
