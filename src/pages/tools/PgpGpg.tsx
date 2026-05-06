/**
 * PGP/GPG Key Generator
 *
 * Full implementation using openpgp.js via a Web Worker.
 * Supports ECC (Curve25519) and RSA (2048/4096) key types.
 * Outputs armored ASCII PEM-style public and private keys.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { OutputBlockSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useWorker } from "@/hooks/useWorker";
import type { WorkerResponse } from "@/workers/crypto.worker";
import type { FAQItem } from "@/components/FAQSection";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type KeyType = "ecc" | "rsa";
type RsaBits = 2048 | 4096;
type Expiry = "none" | "1y" | "2y" | "5y";

const KEY_TYPE_OPTIONS = [
  { value: "ecc" as KeyType, label: "ECC (Curve25519)" },
  { value: "rsa" as KeyType, label: "RSA" },
] as const;

const RSA_BITS_OPTIONS = [
  { value: 2048 as RsaBits, label: "RSA-2048" },
  { value: 4096 as RsaBits, label: "RSA-4096" },
] as const;

const EXPIRY_OPTIONS = [
  { value: "none" as Expiry, label: "No expiry" },
  { value: "1y" as Expiry, label: "1 year" },
  { value: "2y" as Expiry, label: "2 years" },
  { value: "5y" as Expiry, label: "5 years" },
] as const;

const EXPIRY_SECONDS: Record<Expiry, number> = {
  none: 0,
  "1y": 365 * 24 * 3600,
  "2y": 2 * 365 * 24 * 3600,
  "5y": 5 * 365 * 24 * 3600,
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "ECC vs RSA for PGP — which is better?",
    answer:
      "ECC (Curve25519) is recommended for new keys. It generates much faster than RSA, produces smaller keys, and is considered highly secure by modern standards. Curve25519 is specifically designed to be resistant to side-channel attacks. RSA remains widely compatible with older PGP/GPG installations. If you need to send encrypted messages to someone using GPG 2.0 or older, RSA-2048 or RSA-4096 may be necessary.",
  },
  {
    question: "Should I set an expiry date?",
    answer:
      "Yes — setting an expiry is a good practice. An expiry date limits the damage if your private key is ever compromised without you knowing. You can always extend the expiry date later using GPG (gpg --edit-key). A 1–2 year expiry is common for personal keys. Without expiry, a lost or compromised key will appear valid forever on keyservers.",
  },
  {
    question: "How do I import this key into GPG?",
    answer:
      "Save the public key to public.asc and the private key to private.asc. Then run: gpg --import public.asc to import the public key, and gpg --import private.asc to import the private key. After importing, run gpg --list-secret-keys to confirm. For trust: gpg --edit-key <email> → trust → 5 → quit.",
  },
  {
    question: "What is a key fingerprint?",
    answer:
      "A key fingerprint is a short hash (40 hex characters for OpenPGP v4) that uniquely identifies a public key. When exchanging keys in person or via a different channel, compare fingerprints to verify you have the correct key and it hasn't been tampered with. Never rely solely on key IDs (the last 8 or 16 hex chars) — they can be forged. Always verify the full fingerprint.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFingerprint(raw: string): string {
  // Insert spaces every 4 characters for readability
  return raw.match(/.{1,4}/g)?.join(" ") ?? raw;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PgpGpgPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  // Form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");
  const [showPassphrase, setShowPassphrase] = React.useState(false);
  const [keyType, setKeyType] = React.useState<KeyType>("ecc");
  const [rsaBits, setRsaBits] = React.useState<RsaBits>(4096);
  const [expiry, setExpiry] = React.useState<Expiry>("1y");

  // Output state
  const [publicKey, setPublicKey] = React.useState("");
  const [privateKey, setPrivateKey] = React.useState("");
  const [fingerprint, setFingerprint] = React.useState("");
  const [keyId, setKeyId] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Validation
  const [nameError, setNameError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");

  const taskIdRef = React.useRef<string>("");

  const handleMessage = React.useCallback((msg: WorkerResponse) => {
    if (msg.id !== taskIdRef.current) return;

    switch (msg.type) {
      case "PROGRESS":
        setProgress(msg.percent);
        break;
      case "PGP_RESULT":
        setPublicKey(msg.publicKey);
        setPrivateKey(msg.privateKey);
        setFingerprint(msg.fingerprint);
        setKeyId(msg.keyId);
        setIsGenerating(false);
        setProgress(100);
        break;
      case "ERROR":
        setError(msg.message);
        setIsGenerating(false);
        break;
      default:
        break;
    }
  }, []);

  const { send, ready } = useWorker({ onMessage: handleMessage });

  const validate = React.useCallback((): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else {
      setNameError("");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError("Enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }
    return valid;
  }, [name, email]);

  const generate = React.useCallback(() => {
    if (!ready) return;
    if (!validate()) return;

    const id = `pgp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    taskIdRef.current = id;
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setPublicKey("");
    setPrivateKey("");
    setFingerprint("");
    setKeyId("");

    send({
      type: "PGP_GENERATE",
      id,
      name: name.trim(),
      email: email.trim(),
      passphrase,
      keyType,
      rsaBits: keyType === "rsa" ? rsaBits : undefined,
      expirySeconds: EXPIRY_SECONDS[expiry],
    });
  }, [ready, validate, send, name, email, passphrase, keyType, rsaBits, expiry]);

  const hasOutput = publicKey && privateKey;

  return (
    <ToolLayout
      toolId="pgp-gpg"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["ssh-key", "wireguard-key", "encryption-key"]}
      securityNotes="PGP keys are generated in a Web Worker using openpgp.js. Your passphrase and keys never leave your browser."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Options panel */}
        <section
          aria-label="PGP key options"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          <h2 className="text-base font-semibold text-foreground">Key Options</h2>

          {/* Name */}
          <div>
            <label
              htmlFor="pgp-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Name <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input
              id="pgp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Smith"
              autoComplete="name"
              aria-required="true"
              aria-describedby={nameError ? "pgp-name-error" : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
            {nameError && (
              <p id="pgp-name-error" role="alert" className="mt-1 text-xs text-destructive">
                {nameError}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="pgp-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <input
              id="pgp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
              autoComplete="email"
              aria-required="true"
              aria-describedby={emailError ? "pgp-email-error" : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
            {emailError && (
              <p id="pgp-email-error" role="alert" className="mt-xs text-xs text-destructive">
                {emailError}
              </p>
            )}
          </div>

          {/* Passphrase */}
          <div>
            <label
              htmlFor="pgp-passphrase"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Passphrase{" "}
              <span className="font-normal text-muted-foreground">(optional but recommended)</span>
            </label>
            <div className="relative">
              <input
                id="pgp-passphrase"
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Strong passphrase to protect the private key"
                autoComplete="new-password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase((v) => !v)}
                aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassphrase ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your passphrase protects the private key. It is never sent to any server.
            </p>
          </div>

          {/* Key type */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Key type</p>
            <SegmentedControl
              options={KEY_TYPE_OPTIONS}
              value={keyType}
              onChange={setKeyType}
              aria-label="PGP key type"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              ECC (Curve25519) is faster and recommended for new keys. RSA is more widely compatible.
            </p>
          </div>

          {/* RSA bits (only when RSA selected) */}
          {keyType === "rsa" && (
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">RSA key size</p>
              <SegmentedControl
                options={RSA_BITS_OPTIONS}
                value={rsaBits}
                onChange={setRsaBits}
                aria-label="RSA key size"
              />
            </div>
          )}

          {/* Expiry */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Expiry</p>
            <SegmentedControl
              options={EXPIRY_OPTIONS}
              value={expiry}
              onChange={setExpiry}
              aria-label="Key expiry"
            />
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={isGenerating || !ready}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating…" : "Generate PGP Key Pair"}
          </button>
        </section>

        {/* Loading state */}
        {isGenerating && (
          <section
            aria-label="Generating PGP key pair"
            aria-live="polite"
            className="rounded-lg border bg-card p-5 shadow-sm space-y-4 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="PGP key generation progress"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Generating PGP key pair…</p>
            <OutputBlockSkeleton />
            <OutputBlockSkeleton />
          </section>
        )}

        {/* Error state */}
        {error && !isGenerating && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Output panel */}
        {!isGenerating && hasOutput && (
          <section
            aria-label="Generated PGP keys"
            className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
          >
            {/* Key metadata */}
            <div className="rounded-md border bg-muted/40 px-4 py-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="block text-xs text-muted-foreground">Key ID</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    0x{keyId}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Type</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {keyType === "ecc" ? "ECC (Curve25519)" : `RSA-${rsaBits}`}
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Fingerprint</span>
                <span
                  className="font-mono text-sm font-medium text-foreground break-all"
                  aria-label={`Key fingerprint: ${fingerprint}`}
                >
                  {formatFingerprint(fingerprint)}
                </span>
              </div>
            </div>

            {/* Public key */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Public Key</p>
                <div className="flex items-center gap-1.5">
                  <CopyButton value={publicKey} size="sm" label="Copy" />
                  <ExportMenu
                    value={publicKey}
                    filename="pgp-public-key"
                    formats={["txt"]}
                  />
                </div>
              </div>
              <OutputBlock
                value={publicKey}
                multiline
                aria-label="PGP public key in armored format"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Share this key publicly. Save as <code className="font-mono">public.asc</code>.
              </p>
            </div>

            {/* Private key */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Private Key</p>
                <div className="flex items-center gap-1.5">
                  <CopyButton value={privateKey} size="sm" label="Copy" />
                  <ExportMenu
                    value={privateKey}
                    filename="pgp-private-key"
                    formats={["txt"]}
                  />
                </div>
              </div>
              <OutputBlock
                value={privateKey}
                multiline
                aria-label="PGP private key in armored format"
              />
              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Keep your private key secret. Store it encrypted. Never share it.
              </p>
            </div>

            {/* Regenerate button */}
            <button
              type="button"
              onClick={generate}
              className="rounded-md border px-4 py-2 text-sm font-medium transition-colors border-border bg-background text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Regenerate
            </button>
          </section>
        )}
      </motion.div>
    </ToolLayout>
  );
}
