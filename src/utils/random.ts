/**
 * Core entropy source for randomkey.online.
 *
 * ALL cryptographic randomness must flow through this module.
 * Direct calls to window.crypto.getRandomValues elsewhere are forbidden.
 *
 * Math.random() is NEVER used here — this file is security-critical.
 */

/**
 * Returns `n` cryptographically random bytes.
 */
export function getRandomBytes(n: number): Uint8Array {
  if (n < 0 || !Number.isInteger(n)) {
    throw new RangeError(`getRandomBytes: n must be a non-negative integer, got ${n}`);
  }
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/**
 * Returns a cryptographically uniform random integer in [min, max).
 *
 * Uses rejection sampling to eliminate modulo bias entirely.
 */
export function getRandomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new TypeError("getRandomInt: min and max must be integers");
  }
  if (min >= max) {
    throw new RangeError(`getRandomInt: min (${min}) must be less than max (${max})`);
  }

  const range = max - min;

  // Compute the smallest power-of-two mask that covers [0, range)
  // to minimise rejection rate while eliminating bias.
  let bits = 0;
  let n = range - 1;
  while (n > 0) {
    bits++;
    n >>>= 1;
  }
  const bytesNeeded = Math.ceil(bits / 8);
  const mask = (1 << bits) - 1;

  // Rejection loop — expected iterations < 2.
  for (;;) {
    const buf = getRandomBytes(bytesNeeded);
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) | (buf[i] as number);
    }
    value = value & mask;
    if (value < range) {
      return min + value;
    }
  }
}

/**
 * Returns a cryptographically random float in [0, 1).
 *
 * Generates 53 bits of entropy (matching IEEE-754 double precision mantissa).
 */
export function getRandomFloat(): number {
  // We need 53 bits. Read 7 bytes (56 bits) and keep the low 53.
  const buf = getRandomBytes(7);
  let hi = 0;
  let lo = 0;
  // bytes 0-2 → hi (21 bits used from 24)
  for (let i = 0; i < 3; i++) {
    hi = (hi << 8) | (buf[i] as number);
  }
  // bytes 3-6 → lo (32 bits)
  for (let i = 3; i < 7; i++) {
    lo = (lo * 256 + (buf[i] as number)) >>> 0;
  }
  // Keep low 21 bits of hi for the high part, and full 32 bits of lo.
  const hiMasked = hi & 0x1fffff; // 21 bits
  // Result = (hiMasked * 2^32 + lo) / 2^53
  return (hiMasked * 4294967296 + lo) / 9007199254740992;
}

/**
 * Returns a uniformly random element from a non-empty readonly array.
 */
export function randomChoice<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new RangeError("randomChoice: array must not be empty");
  }
  const index = getRandomInt(0, arr.length);
  // Safe: getRandomInt guarantees 0 <= index < arr.length
  return arr[index] as T;
}

/**
 * Returns a new array with the same elements in a cryptographically random order.
 * Uses Fisher-Yates shuffle with crypto RNG.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    const temp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = temp;
  }
  return result;
}

/**
 * Returns a cryptographically random BigInt with exactly `bits` bits of entropy.
 * The value is in the range [2^(bits-1), 2^bits).
 */
export function randomBigInt(bits: number): bigint {
  if (bits < 1 || !Number.isInteger(bits)) {
    throw new RangeError(`randomBigInt: bits must be a positive integer, got ${bits}`);
  }

  const byteCount = Math.ceil(bits / 8);
  const buf = getRandomBytes(byteCount);

  // Clear leading bits that exceed the requested bit count
  const excessBits = byteCount * 8 - bits;
  if (excessBits > 0) {
    buf[0] = (buf[0] as number) & (0xff >> excessBits);
  }

  // Set the most-significant bit to guarantee exactly `bits` bits
  const msbByteIndex = 0;
  const msbBit = 7 - excessBits;
  buf[msbByteIndex] = (buf[msbByteIndex] as number) | (1 << msbBit);

  // Convert bytes to BigInt (big-endian)
  let result = 0n;
  for (const byte of buf) {
    result = (result << 8n) | BigInt(byte);
  }

  return result;
}
