import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generateAESKey, exportAESKeyAsHex, exportAESKeyAsBase64 } from "@/utils/aes";
import { generateHMACKey } from "@/utils/apikey";
import { toBase64Url } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Which key length should I choose?",
    answer:
      "AES-256 is the current standard for symmetric encryption and is recommended for new applications. AES-128 is also secure and faster on hardware without AES-NI instructions. AES-192 is rarely used. For HMAC, choose the key size matching your hash algorithm: HMAC-SHA256 uses 256-bit keys, HMAC-SHA512 uses 512-bit keys.",
  },
  {
    question: "What is the difference between AES and HMAC keys?",
    answer:
      "AES keys are used for symmetric encryption — transforming data into ciphertext that can only be read by someone with the key. HMAC keys are used for message authentication — proving that data came from someone with the key and hasn't been tampered with. They serve different purposes and should not be used interchangeably.",
  },
  {
    question: "How should I store encryption keys?",
    answer:
      "Never hardcode keys in source code. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault) for production. For development, use environment variables loaded from a .env file that is gitignored. Keys at rest should themselves be encrypted using a key management system.",
  },
  {
    question: "Can I use the same key for multiple purposes?",
    answer:
      "No — key separation is a fundamental security principle. Use different keys for different purposes (encryption vs. authentication), different environments (development vs. production), and different users or tenants. Reusing keys across contexts can allow an attacker to exploit one context to attack another.",
  },
];

type Algorithm = "AES-128" | "AES-192" | "AES-256" | "HMAC-256" | "HMAC-512";
type Format = "hex" | "base64" | "base64url";

const ALGORITHM_OPTIONS = [
  { value: "AES-128" as Algorithm, label: "AES-128" },
  { value: "AES-192" as Algorithm, label: "AES-192" },
  { value: "AES-256" as Algorithm, label: "AES-256" },
  { value: "HMAC-256" as Algorithm, label: "HMAC-256" },
  { value: "HMAC-512" as Algorithm, label: "HMAC-512" },
] as const;

const FORMAT_OPTIONS = [
  { value: "hex" as Format, label: "Hex" },
  { value: "base64" as Format, label: "Base64" },
  { value: "base64url" as Format, label: "Base64URL" },
] as const;

async function generateKey(algorithm: Algorithm, format: Format): Promise<string> {
  if (algorithm === "HMAC-256") {
    const hex = await generateHMACKey(256);
    if (format === "hex") return hex;
    const rawBytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < rawBytes.length; i++) {
      rawBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return format === "base64url" ? toBase64Url(rawBytes) : btoa(String.fromCharCode(...rawBytes));
  }
  if (algorithm === "HMAC-512") {
    const hex = await generateHMACKey(512);
    if (format === "hex") return hex;
    const rawBytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < rawBytes.length; i++) {
      rawBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return format === "base64url" ? toBase64Url(rawBytes) : btoa(String.fromCharCode(...rawBytes));
  }

  const bits = algorithm === "AES-128" ? 128 : algorithm === "AES-192" ? 192 : 256;
  const key = await generateAESKey(bits);
  if (format === "hex") return exportAESKeyAsHex(key);
  const b64 = await exportAESKeyAsBase64(key);
  if (format === "base64url") return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

export default function EncryptionKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [algorithm, setAlgorithm] = React.useState<Algorithm>("AES-256");
  const [format, setFormat] = React.useState<Format>("hex");
  const [output, setOutput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const doGenerate = React.useCallback(async (alg: Algorithm, fmt: Format) => {
    setIsGenerating(true);
    try {
      const result = await generateKey(alg, fmt);
      setOutput(result);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    void doGenerate(algorithm, format);
  }, [algorithm, format, doGenerate]);

  const handleRegenerate = React.useCallback(() => {
    void doGenerate(algorithm, format);
  }, [algorithm, format, doGenerate]);

  const bits = algorithm === "AES-128" ? 128 : algorithm === "AES-192" ? 192 : algorithm === "AES-256" ? 256 : algorithm === "HMAC-256" ? 256 : 512;

  return (
    <ToolLayout
      toolId="encryption-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["aes-key", "hmac-key", "jwt-secret"]}
      securityNotes="Encryption keys are generated using SubtleCrypto and never leave your browser. Store them securely using a secrets manager — never in source code."
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
          filename="encryption-key"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Algorithm</p>
              <SegmentedControl
                options={ALGORITHM_OPTIONS}
                value={algorithm}
                onChange={(v) => setAlgorithm(v)}
                aria-label="Encryption algorithm"
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
              {bits}-bit key &mdash; {bits} bits of cryptographic randomness
            </p>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
