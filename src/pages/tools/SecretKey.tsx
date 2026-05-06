import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { getRandomBytes } from "@/utils/random";
import { toHex, toBase64, toBase64Url } from "@/utils/encoding";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "When should I use a generic secret key?",
    answer:
      "Use a generic secret key when you need a random high-entropy value for: signing tokens, encrypting application data, seeding a PRNG, generating session IDs, or any other application-specific secret that doesn't require a specific cryptographic algorithm's key format.",
  },
  {
    question: "How much entropy do I need?",
    answer:
      "32 bytes (256 bits) is the standard recommendation for most security applications. 16 bytes (128 bits) is acceptable for session identifiers and similar non-critical tokens. 64 bytes (512 bits) provides a future-proof margin for long-lived secrets. Choose based on the sensitivity and lifetime of the secret.",
  },
  {
    question: "What is the difference between hex and base64url formats?",
    answer:
      "Both represent the same random bytes in different text encodings. Hex uses 0-9 and a-f (2 chars per byte), base64url uses A-Z, a-z, 0-9, - and _ without padding (about 1.33 chars per byte). Base64url is more compact and URL-safe. Use hex when the receiving system expects hex; use base64url for JWT libraries and web APIs.",
  },
  {
    question: "Is this different from an API key or JWT secret?",
    answer:
      "Functionally similar — all three use cryptographic randomness. The difference is in intended use and format conventions. API keys often have prefixes and specific encoding requirements. JWT secrets typically need to be base64url-encoded. This tool generates plain random bytes in your chosen format without format-specific constraints.",
  },
];

type KeyLength = 16 | 24 | 32 | 64;
type Format = "hex" | "base64" | "base64url";

const LENGTH_OPTIONS = [
  { value: 16 as KeyLength, label: "16 bytes" },
  { value: 24 as KeyLength, label: "24 bytes" },
  { value: 32 as KeyLength, label: "32 bytes" },
  { value: 64 as KeyLength, label: "64 bytes" },
] as const;

const FORMAT_OPTIONS = [
  { value: "hex" as Format, label: "Hex" },
  { value: "base64" as Format, label: "Base64" },
  { value: "base64url" as Format, label: "Base64URL" },
] as const;

function generateSecretKey(length: KeyLength, format: Format): string {
  const bytes = getRandomBytes(length);
  switch (format) {
    case "hex": return toHex(bytes);
    case "base64": return toBase64(bytes);
    case "base64url": return toBase64Url(bytes);
  }
}

export default function SecretKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState<KeyLength>(32);
  const [format, setFormat] = React.useState<Format>("hex");
  const [output, setOutput] = React.useState<string>(() => generateSecretKey(32, "hex"));

  React.useEffect(() => {
    setOutput(generateSecretKey(length, format));
  }, [length, format]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateSecretKey(length, format));
  }, [length, format]);

  const entropyBits = estimateBits(256, length); // 256 possible values per byte

  return (
    <ToolLayout
      toolId="secret-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["api-key", "jwt-secret", "hmac-key"]}
      securityNotes="Generated using window.crypto.getRandomValues. Never store in source code or version control — use environment variables or a secrets manager."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          showEntropy
          entropyBits={entropyBits}
          filename="secret-key"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Key length</p>
              <SegmentedControl
                options={LENGTH_OPTIONS}
                value={length}
                onChange={(v) => setLength(v)}
                aria-label="Key length in bytes"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Format</p>
              <SegmentedControl
                options={FORMAT_OPTIONS}
                value={format}
                onChange={(v) => setFormat(v)}
                aria-label="Key encoding format"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {length} bytes &mdash; {length * 8} bits of cryptographic randomness
            </p>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
