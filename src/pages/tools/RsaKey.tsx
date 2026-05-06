/**
 * RSA Key Generator
 *
 * Generates RSA key pairs using SubtleCrypto inside a Web Worker.
 * Supports 2048, 3072, and 4096-bit keys.
 * Outputs PEM-formatted PKCS#8 (private) and SPKI (public) keys.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
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

type KeyBits = 2048 | 3072 | 4096;

const KEY_SIZE_OPTIONS = [
  { value: 2048 as KeyBits, label: "RSA-2048" },
  { value: 3072 as KeyBits, label: "RSA-3072" },
  { value: 4096 as KeyBits, label: "RSA-4096" },
] as const;

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "RSA-2048 vs RSA-4096 — which should I use?",
    answer:
      "RSA-2048 is considered secure for most current use cases and generates much faster. RSA-4096 provides a larger security margin and is recommended for long-lived keys or high-sensitivity applications, but takes significantly longer to generate and is slower for every operation. NIST and most security bodies consider RSA-2048 acceptable through at least 2030. RSA-3072 is a good middle ground if you need extra margin without the full cost of RSA-4096.",
  },
  {
    question: "What is a PEM file?",
    answer:
      "PEM (Privacy Enhanced Mail) is a Base64-encoded format for storing cryptographic keys and certificates. It wraps the binary DER data in header/footer lines like -----BEGIN PRIVATE KEY-----. Most tools (OpenSSL, SSH, TLS servers) accept PEM-formatted keys. Private keys use PKCS#8 format; public keys use SPKI format in this generator.",
  },
  {
    question: "How do I use this RSA key?",
    answer:
      "Save the private key to a file (e.g. private.pem) with permissions 600. The public key can be freely shared. Common uses: TLS client certificates (with a CA), code signing, JWT RS256 tokens (sign with private, verify with public), and data encryption. With OpenSSL: openssl rsa -in private.pem -pubout verifies the key pair.",
  },
  {
    question: "Is browser-based RSA key generation secure?",
    answer:
      "Yes — RSA key generation uses the browser's built-in SubtleCrypto API (window.crypto.subtle), which is the same cryptographic foundation used by HTTPS/TLS in your browser. The key pair is generated entirely in a Web Worker, never transmitted, and never logged. The entropy source is window.crypto.getRandomValues. The main limitation is that the generated private key exists in browser memory — for extremely high-security use cases, air-gapped hardware security modules (HSMs) are preferred.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RsaKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const [bits, setBits] = React.useState<KeyBits>(2048);
  const [privateKey, setPrivateKey] = React.useState("");
  const [publicKey, setPublicKey] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Unique ID per generation request
  const taskIdRef = React.useRef<string>("");

  const handleMessage = React.useCallback((msg: WorkerResponse) => {
    if (msg.id !== taskIdRef.current) return;

    switch (msg.type) {
      case "PROGRESS":
        setProgress(msg.percent);
        break;
      case "RSA_RESULT":
        setPrivateKey(msg.privateKey);
        setPublicKey(msg.publicKey);
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

  const generate = React.useCallback(
    (keyBits: KeyBits) => {
      if (!ready) return;
      const id = `rsa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      taskIdRef.current = id;
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      setPrivateKey("");
      setPublicKey("");
      send({ type: "RSA_GENERATE", id, bits: keyBits });
    },
    [ready, send],
  );

  // Auto-generate on mount and when key size changes
  React.useEffect(() => {
    if (ready) {
      generate(bits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, bits]);

  const handleRegenerate = React.useCallback(() => {
    generate(bits);
  }, [bits, generate]);

  const handleBitsChange = React.useCallback((newBits: KeyBits) => {
    setBits(newBits);
    // generate is triggered via the effect above
  }, []);

  return (
    <ToolLayout
      toolId="rsa-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["ssh-key", "encryption-key", "pgp-gpg"]}
      securityNotes="RSA key generation runs in a Web Worker and uses the browser's SubtleCrypto API. Your private key never leaves your browser."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <section
          aria-label="RSA key generator"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          {/* Options */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Key size</p>
            <SegmentedControl
              options={KEY_SIZE_OPTIONS}
              value={bits}
              onChange={handleBitsChange}
              aria-label="RSA key size"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              RSA-4096 can take 5–15 seconds. The UI stays responsive because generation runs in a Web Worker.
            </p>
          </div>

          {/* Loading state */}
          {isGenerating && (
            <div className="space-y-4" aria-live="polite" aria-label="Generating RSA key pair">
              <div className="flex items-center gap-3">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`RSA-${bits} key generation progress`}
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
              <p className="text-sm text-muted-foreground">
                Generating RSA-{bits} key pair… this may take a few seconds.
              </p>
              <OutputBlockSkeleton />
              <OutputBlockSkeleton />
            </div>
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

          {/* Output */}
          {!isGenerating && !error && privateKey && publicKey && (
            <div className="space-y-5">
              {/* Key metadata */}
              <div className="rounded-md border bg-muted/40 px-4 py-3">
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div>
                    <span className="block text-muted-foreground">Algorithm</span>
                    <span className="font-mono font-medium text-foreground">RSASSA-PKCS1-v1_5</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Hash</span>
                    <span className="font-mono font-medium text-foreground">SHA-256</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Modulus length</span>
                    <span className="font-mono font-medium text-foreground">{bits} bits</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Format</span>
                    <span className="font-mono font-medium text-foreground">PKCS#8 / SPKI PEM</span>
                  </div>
                </div>
              </div>

              {/* Private key */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Private Key (PKCS#8)</p>
                  <div className="flex items-center gap-1.5">
                    <CopyButton value={privateKey} size="sm" label="Copy" />
                    <ExportMenu
                      value={privateKey}
                      filename="rsa-private-key"
                      formats={["txt"]}
                    />
                  </div>
                </div>
                <OutputBlock
                  value={privateKey}
                  multiline
                  aria-label="RSA private key in PEM format"
                />
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Keep your private key secure. Never share it. Store it encrypted.
                </p>
              </div>

              {/* Public key */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Public Key (SPKI)</p>
                  <div className="flex items-center gap-1.5">
                    <CopyButton value={publicKey} size="sm" label="Copy" />
                    <ExportMenu
                      value={publicKey}
                      filename="rsa-public-key"
                      formats={["txt"]}
                    />
                  </div>
                </div>
                <OutputBlock
                  value={publicKey}
                  multiline
                  aria-label="RSA public key in PEM format"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This key can be shared freely. Others use it to verify your signatures or encrypt messages to you.
                </p>
              </div>

              {/* Regenerate button */}
              <button
                type="button"
                onClick={handleRegenerate}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors border-border bg-background text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Regenerate key pair
              </button>
            </div>
          )}
        </section>
      </motion.div>
    </ToolLayout>
  );
}
