/**
 * crypto.worker.ts — Shared Web Worker for heavy cryptographic operations.
 *
 * Handles:
 *  - RSA key pair generation (SubtleCrypto, no extra library)
 *  - PGP key pair generation (openpgp.js, dynamically imported)
 *  - Bulk password generation (crypto.getRandomValues)
 *  - File hashing (SubtleCrypto)
 *
 * All secrets stay inside the worker. Nothing is logged or transmitted.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PasswordOpts {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export type WorkerRequest =
  | { type: "RSA_GENERATE"; id: string; bits: 2048 | 3072 | 4096 }
  | {
      type: "PGP_GENERATE";
      id: string;
      name: string;
      email: string;
      passphrase: string;
      keyType: "rsa" | "ecc";
      rsaBits?: 2048 | 4096;
      expirySeconds?: number;
    }
  | { type: "BULK_PASSWORD"; id: string; count: number; opts: PasswordOpts }
  | {
      type: "HASH_FILE";
      id: string;
      algorithm: "SHA-256" | "SHA-512";
      data: ArrayBuffer;
    };

export type WorkerResponse =
  | {
      type: "RSA_RESULT";
      id: string;
      privateKey: string;
      publicKey: string;
    }
  | {
      type: "PGP_RESULT";
      id: string;
      privateKey: string;
      publicKey: string;
      fingerprint: string;
      keyId: string;
    }
  | { type: "BULK_RESULT"; id: string; passwords: string[] }
  | { type: "HASH_RESULT"; id: string; hex: string }
  | { type: "ERROR"; id: string; message: string }
  | { type: "PROGRESS"; id: string; percent: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts an ArrayBuffer to a PEM-formatted string.
 * Uses btoa with a manual char loop — avoids spread operator on large arrays.
 */
function toPEM(label: string, bytes: ArrayBuffer): string {
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i] ?? 0);
  }
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// RSA generation
// ---------------------------------------------------------------------------

async function handleRsaGenerate(
  id: string,
  bits: 2048 | 3072 | 4096,
): Promise<void> {
  try {
    self.postMessage({ type: "PROGRESS", id, percent: 10 } satisfies WorkerResponse);

    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: bits,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );

    self.postMessage({ type: "PROGRESS", id, percent: 70 } satisfies WorkerResponse);

    const [privateKeyBuffer, publicKeyBuffer] = await Promise.all([
      crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
      crypto.subtle.exportKey("spki", keyPair.publicKey),
    ]);

    self.postMessage({ type: "PROGRESS", id, percent: 95 } satisfies WorkerResponse);

    const privateKey = toPEM("PRIVATE KEY", privateKeyBuffer);
    const publicKey = toPEM("PUBLIC KEY", publicKeyBuffer);

    self.postMessage({
      type: "RSA_RESULT",
      id,
      privateKey,
      publicKey,
    } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      message: err instanceof Error ? err.message : "RSA generation failed",
    } satisfies WorkerResponse);
  }
}

// ---------------------------------------------------------------------------
// PGP generation
// ---------------------------------------------------------------------------

async function handlePgpGenerate(
  id: string,
  name: string,
  email: string,
  passphrase: string,
  keyType: "rsa" | "ecc",
  rsaBits?: 2048 | 4096,
  expirySeconds?: number,
): Promise<void> {
  try {
    self.postMessage({ type: "PROGRESS", id, percent: 10 } satisfies WorkerResponse);

    // Dynamic import — keeps openpgp out of the main bundle
    const openpgp = await import("openpgp");

    self.postMessage({ type: "PROGRESS", id, percent: 30 } satisfies WorkerResponse);

    const userIDs = [{ name, email }];
    const passphraseArg = passphrase || undefined;
    const expirationArg =
      expirySeconds !== undefined && expirySeconds > 0 ? expirySeconds : undefined;

    // Call generateKey separately for each key type to get proper type inference.
    // format: 'armored' (the default) ensures we always get string keys back.
    let armoredPublicKey: string;
    let armoredPrivateKey: string;

    if (keyType === "ecc") {
      const result = await openpgp.generateKey({
        type: "curve25519",
        userIDs,
        passphrase: passphraseArg,
        keyExpirationTime: expirationArg,
        format: "armored",
      });
      armoredPublicKey = result.publicKey;
      armoredPrivateKey = result.privateKey;
    } else {
      const result = await openpgp.generateKey({
        type: "rsa",
        rsaBits: rsaBits ?? 4096,
        userIDs,
        passphrase: passphraseArg,
        keyExpirationTime: expirationArg,
        format: "armored",
      });
      armoredPublicKey = result.publicKey;
      armoredPrivateKey = result.privateKey;
    }

    self.postMessage({ type: "PROGRESS", id, percent: 85 } satisfies WorkerResponse);

    // Extract key ID and fingerprint from the armored public key
    const readResult = await openpgp.readKey({ armoredKey: armoredPublicKey });
    const keyIdHex = readResult.getKeyID().toHex().toUpperCase();
    // getFingerprint() returns a hex string in openpgp.js v6
    const fingerprintHex = readResult.getFingerprint().toUpperCase();

    self.postMessage({
      type: "PGP_RESULT",
      id,
      privateKey: armoredPrivateKey,
      publicKey: armoredPublicKey,
      fingerprint: fingerprintHex,
      keyId: keyIdHex,
    } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      message: err instanceof Error ? err.message : "PGP generation failed",
    } satisfies WorkerResponse);
  }
}

// ---------------------------------------------------------------------------
// Bulk password generation
// ---------------------------------------------------------------------------

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

function generateOnePassword(opts: PasswordOpts): string {
  const { length, uppercase, lowercase, digits, symbols } = opts;

  const pools: string[] = [];
  if (uppercase) pools.push(CHARSETS.uppercase);
  if (lowercase) pools.push(CHARSETS.lowercase);
  if (digits) pools.push(CHARSETS.digits);
  if (symbols) pools.push(CHARSETS.symbols);

  if (pools.length === 0) return "";

  const combined = pools.join("");
  const combinedLen = combined.length;

  // Mandatory characters (at least one from each pool)
  const mandatory: string[] = pools.map((pool) => {
    const idx = new Uint32Array(1);
    crypto.getRandomValues(idx);
    return pool[(idx[0] ?? 0) % pool.length] ?? "";
  });

  const result: string[] = [...mandatory];

  // Fill remaining slots from combined pool
  const remaining = length - mandatory.length;
  if (remaining > 0) {
    const buf = new Uint32Array(remaining);
    crypto.getRandomValues(buf);
    for (let i = 0; i < remaining; i++) {
      result.push(combined[(buf[i] ?? 0) % combinedLen] ?? "");
    }
  }

  // Fisher-Yates shuffle
  const shuffleBuf = new Uint32Array(result.length);
  crypto.getRandomValues(shuffleBuf);
  for (let i = result.length - 1; i > 0; i--) {
    const j = (shuffleBuf[i] ?? 0) % (i + 1);
    const tmp = result[i];
    result[i] = result[j] ?? "";
    result[j] = tmp ?? "";
  }

  return result.join("");
}

async function handleBulkPassword(
  id: string,
  count: number,
  opts: PasswordOpts,
): Promise<void> {
  try {
    const passwords: string[] = [];
    const chunkSize = 10;

    for (let i = 0; i < count; i++) {
      passwords.push(generateOnePassword(opts));

      // Emit progress every chunk
      if ((i + 1) % chunkSize === 0 || i === count - 1) {
        const percent = Math.round(((i + 1) / count) * 100);
        self.postMessage({ type: "PROGRESS", id, percent } satisfies WorkerResponse);
        // Yield to event loop so progress messages flush
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }

    self.postMessage({
      type: "BULK_RESULT",
      id,
      passwords,
    } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      message: err instanceof Error ? err.message : "Bulk generation failed",
    } satisfies WorkerResponse);
  }
}

// ---------------------------------------------------------------------------
// File hashing
// ---------------------------------------------------------------------------

async function handleHashFile(
  id: string,
  algorithm: "SHA-256" | "SHA-512",
  data: ArrayBuffer,
): Promise<void> {
  try {
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hex = toHex(new Uint8Array(hashBuffer));
    self.postMessage({ type: "HASH_RESULT", id, hex } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      type: "ERROR",
      id,
      message: err instanceof Error ? err.message : "Hashing failed",
    } satisfies WorkerResponse);
  }
}

// ---------------------------------------------------------------------------
// Message router
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  switch (req.type) {
    case "RSA_GENERATE":
      void handleRsaGenerate(req.id, req.bits);
      break;

    case "PGP_GENERATE":
      void handlePgpGenerate(
        req.id,
        req.name,
        req.email,
        req.passphrase,
        req.keyType,
        req.rsaBits,
        req.expirySeconds,
      );
      break;

    case "BULK_PASSWORD":
      void handleBulkPassword(req.id, req.count, req.opts);
      break;

    case "HASH_FILE":
      void handleHashFile(req.id, req.algorithm, req.data);
      break;

    default: {
      // TypeScript exhaustiveness — should never happen at runtime
      const _exhaustive: never = req;
      void _exhaustive;
    }
  }
};
