import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Terminal } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { getRandomBytes } from "@/utils/random";
import { toHex } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is PGP / GPG?",
    answer:
      "PGP (Pretty Good Privacy) is a standard for encrypted communication and digital signatures. GPG (GNU Privacy Guard) is the most widely used open-source implementation. PGP uses asymmetric cryptography: you publish a public key that others use to encrypt messages to you, and you decrypt them with your private key. It's commonly used for email encryption (with tools like Thunderbird + Enigmail) and code signing.",
  },
  {
    question: "What is the difference between PGP and GPG?",
    answer:
      "PGP is the original standard (now owned by Symantec/Broadcom). OpenPGP is the open standard (RFC 4880) derived from PGP. GPG (GnuPG) is the primary open-source implementation of OpenPGP. For practical purposes, they are interoperable — a key generated with GPG works with any OpenPGP-compatible software.",
  },
  {
    question: "Why should I generate PGP keys with GPG CLI instead of a browser tool?",
    answer:
      "Full PGP key generation involves computationally intensive RSA operations and requires a trusted entropy source. For production key pairs, the GPG CLI running on your own machine gives you the most control and auditability. Browser-based PGP key generation (using openpgp.js) is being added in a future phase.",
  },
  {
    question: "What is a key fingerprint?",
    answer:
      "A key fingerprint is a short hash of a public key used to verify identity without exchanging the full key. When you meet someone in person to exchange PGP keys, you compare fingerprints verbally to ensure the key hasn't been tampered with. The 8-byte ID shown below is a mock fingerprint for testing purposes only.",
  },
];

function generateTestKeyId(): string {
  const bytes = getRandomBytes(8);
  return toHex(bytes).toUpperCase();
}

const CLI_COMMANDS = [
  { cmd: "gpg --full-generate-key", desc: "Generate a new key pair (interactive)" },
  { cmd: "gpg --list-keys", desc: "List all public keys in your keyring" },
  { cmd: "gpg --list-secret-keys", desc: "List all private keys in your keyring" },
  { cmd: "gpg --export --armor <key-id>", desc: "Export a public key in ASCII armor format" },
  { cmd: "gpg --export-secret-keys --armor <key-id>", desc: "Export a private key in ASCII armor format" },
  { cmd: "gpg --recv-keys <key-id>", desc: "Fetch a public key from a keyserver" },
  { cmd: "gpg --send-keys <key-id>", desc: "Upload your public key to a keyserver" },
];

export default function PgpGpgPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [testKeyId, setTestKeyId] = React.useState<string>(() => generateTestKeyId());

  const handleRegenerate = React.useCallback(() => {
    setTestKeyId(generateTestKeyId());
  }, []);

  return (
    <ToolLayout
      toolId="pgp-gpg"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["ssh-key", "wireguard-key", "encryption-key"]}
      securityNotes="For production PGP keys, always use the GPG CLI on your own machine. Browser-based PGP key generation (openpgp.js) is available in Phase 7."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Test Key ID generator */}
        <GeneratorPanel
          output={`0x${testKeyId}`}
          onRegenerate={handleRegenerate}
          outputLabel="Test Key ID (mock — for testing only)"
          filename="pgp-test-key-id"
          exportFormats={["txt"]}
        >
          <p className="text-xs text-muted-foreground">
            This is a randomly generated 8-byte hex string formatted as a PGP key ID. It is NOT a real PGP key — use it only for UI testing and development. For real PGP keys, use the GPG commands below.
          </p>
        </GeneratorPanel>

        {/* GPG CLI reference */}
        <section
          aria-label="GPG CLI commands"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-4 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">GPG CLI Commands</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            For production PGP keys, use the GPG command-line tool. Install via: <span className="font-mono text-xs">brew install gnupg</span> (macOS), <span className="font-mono text-xs">apt install gnupg</span> (Debian/Ubuntu), or <span className="font-mono text-xs">winget install GnuPG.GnuPG</span> (Windows).
          </p>

          <div className="space-y-2">
            {CLI_COMMANDS.map(({ cmd, desc }) => (
              <div key={cmd} className="rounded-md border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <code className="font-mono text-sm text-foreground break-all">{cmd}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            Full PGP key generation using openpgp.js is available in Phase 7. It requires a Web Worker due to the computational intensity of RSA key generation.
          </div>
        </section>
      </motion.div>
    </ToolLayout>
  );
}
