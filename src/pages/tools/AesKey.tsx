import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generateAESKey, exportAESKeyAsHex, exportAESKeyAsBase64, exportAESKeyAsBytes } from "@/utils/aes";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is AES and when should I use it?",
    answer:
      "AES (Advanced Encryption Standard) is the most widely used symmetric encryption algorithm, standardized by NIST in 2001. Use it to encrypt data at rest (files, database fields) or for secure inter-service communication. It requires the same key for both encryption and decryption.",
  },
  {
    question: "AES-128 vs AES-256 — which should I choose?",
    answer:
      "Both are considered secure for the foreseeable future. AES-256 provides a larger security margin and is required for top-secret government data (FIPS 140-2 Level 3+). AES-128 is faster on systems without hardware AES acceleration and is sufficient for most commercial applications. When in doubt, use AES-256.",
  },
  {
    question: "What is GCM mode and why does it matter?",
    answer:
      "AES-GCM (Galois/Counter Mode) is an authenticated encryption mode that provides both confidentiality and data integrity in a single operation. It prevents attackers from tampering with ciphertext undetected. Always prefer AES-GCM over older modes like AES-CBC or AES-ECB for new applications.",
  },
  {
    question: "How do I store AES keys safely?",
    answer:
      "In production, use a dedicated key management service: AWS KMS, Google Cloud KMS, Azure Key Vault, or HashiCorp Vault. For local development, store in environment variables loaded from a .gitignored .env file. Never commit keys to source control or include them in application code.",
  },
];

type KeySize = 128 | 192 | 256;
type Format = "hex" | "base64" | "base64url" | "raw";

const SIZE_OPTIONS = [
  { value: 128 as KeySize, label: "AES-128" },
  { value: 192 as KeySize, label: "AES-192" },
  { value: 256 as KeySize, label: "AES-256" },
] as const;

const FORMAT_OPTIONS = [
  { value: "hex" as Format, label: "Hex" },
  { value: "base64" as Format, label: "Base64" },
  { value: "base64url" as Format, label: "Base64URL" },
  { value: "raw" as Format, label: "Byte array" },
] as const;

async function doGenerateAES(bits: KeySize, format: Format): Promise<string> {
  const key = await generateAESKey(bits);
  switch (format) {
    case "hex": return exportAESKeyAsHex(key);
    case "base64": return exportAESKeyAsBase64(key);
    case "base64url": {
      const b64 = await exportAESKeyAsBase64(key);
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    case "raw": {
      const bytes = await exportAESKeyAsBytes(key);
      return `[${Array.from(bytes).join(", ")}]`;
    }
  }
}

export default function AesKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [keySize, setKeySize] = React.useState<KeySize>(256);
  const [format, setFormat] = React.useState<Format>("hex");
  const [output, setOutput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generate = React.useCallback(async (bits: KeySize, fmt: Format) => {
    setIsGenerating(true);
    try {
      const result = await doGenerateAES(bits, fmt);
      setOutput(result);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    void generate(keySize, format);
  }, [keySize, format, generate]);

  const handleRegenerate = React.useCallback(() => {
    void generate(keySize, format);
  }, [keySize, format, generate]);

  return (
    <ToolLayout
      toolId="aes-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["encryption-key", "hmac-key", "salt-generator"]}
      securityNotes="AES keys are generated using SubtleCrypto.generateKey() — browser-native hardware-backed randomness. Keys never leave your browser."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
          filename="aes-key"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Key size</p>
              <SegmentedControl
                options={SIZE_OPTIONS}
                value={keySize}
                onChange={(v) => setKeySize(v)}
                aria-label="AES key size"
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
              {keySize}-bit AES key &mdash; {keySize / 8} bytes of cryptographic randomness
            </p>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
