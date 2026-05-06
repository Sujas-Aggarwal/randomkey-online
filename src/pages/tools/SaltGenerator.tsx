import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { generateSalt, generateSaltBytes, bcryptSalt } from "@/utils/salt";
import { toBase64, toBase64Url } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a cryptographic salt?",
    answer:
      "A salt is a random value added to a password before hashing. It ensures that even if two users have the same password, their stored hashes will be different. Salts also prevent rainbow table attacks, where precomputed hashes of common passwords are used to crack stolen hash databases.",
  },
  {
    question: "Why must each salt be unique?",
    answer:
      "If two passwords share a salt, an attacker who knows one password can immediately check if the other hash matches — defeating the purpose. Each password must have its own randomly generated salt, generated fresh at the time of hash creation. The salt is stored alongside the hash (it doesn't need to be secret).",
  },
  {
    question: "bcrypt vs Argon2 — which should I use for password hashing?",
    answer:
      "Both are strong choices for password hashing. Argon2id (winner of the 2015 Password Hashing Competition) is the current recommendation — it resists both time-memory trade-off and GPU attacks. bcrypt is a solid, well-tested alternative that remains secure when configured with a high work factor. Never use plain SHA-256 or MD5 for password hashing without a proper key derivation function.",
  },
  {
    question: "How long should a salt be?",
    answer:
      "A minimum of 16 bytes (128 bits) is recommended by NIST SP 800-132. Most modern libraries use 16–32 bytes. This tool defaults to 32 bytes (256 bits) for maximum compatibility and security. The salt only needs to be unique, not secret — its entropy prevents precomputation attacks.",
  },
];

type SaltLength = 16 | 32 | 64;
type Format = "hex" | "base64" | "base64url";

const LENGTH_OPTIONS = [
  { value: 16 as SaltLength, label: "16 bytes" },
  { value: 32 as SaltLength, label: "32 bytes" },
  { value: 64 as SaltLength, label: "64 bytes" },
] as const;

const FORMAT_OPTIONS = [
  { value: "hex" as Format, label: "Hex" },
  { value: "base64" as Format, label: "Base64" },
  { value: "base64url" as Format, label: "Base64URL" },
] as const;

function generateSaltValue(length: SaltLength, format: Format): string {
  switch (format) {
    case "hex": return generateSalt(length);
    case "base64": return toBase64(generateSaltBytes(length));
    case "base64url": return toBase64Url(generateSaltBytes(length));
  }
}

export default function SaltGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState<SaltLength>(32);
  const [format, setFormat] = React.useState<Format>("hex");
  const [output, setOutput] = React.useState<string>(() => generateSalt(32));
  const bcrypt = bcryptSalt();
  const [bcryptPreview, setBcryptPreview] = React.useState<string>(bcrypt);

  React.useEffect(() => {
    setOutput(generateSaltValue(length, format));
    setBcryptPreview(bcryptSalt());
  }, [length, format]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateSaltValue(length, format));
    setBcryptPreview(bcryptSalt());
  }, [length, format]);

  return (
    <ToolLayout
      toolId="salt-generator"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["hash-generator", "encryption-key", "aes-key"]}
      securityNotes="Salts are generated using window.crypto.getRandomValues. Each salt is unique. Store salts alongside hashes — they do not need to be secret."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          filename="salt"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Length</p>
              <SegmentedControl
                options={LENGTH_OPTIONS}
                value={length}
                onChange={(v) => setLength(v)}
                aria-label="Salt length in bytes"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Format</p>
              <SegmentedControl
                options={FORMAT_OPTIONS}
                value={format}
                onChange={(v) => setFormat(v)}
                aria-label="Salt encoding format"
              />
            </div>

            {/* bcrypt preview */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">bcrypt salt preview</p>
              <p className="mb-2 text-xs text-muted-foreground">
                How this salt would appear in a bcrypt hash string ($2b$12$…). Feed to a real bcrypt library for actual hashing.
              </p>
              <OutputBlock value={bcryptPreview} aria-label="bcrypt salt preview" />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
