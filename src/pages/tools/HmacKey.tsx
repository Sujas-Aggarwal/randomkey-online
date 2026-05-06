import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generateHMACKey } from "@/utils/apikey";
import { toBase64Url } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is HMAC and what is it used for?",
    answer:
      "HMAC (Hash-based Message Authentication Code) uses a secret key combined with a hash function to create a message authentication tag. It proves that a message came from someone who knows the key and that the message hasn't been modified. Common uses: API authentication, JWT signing, webhook verification, and secure cookies.",
  },
  {
    question: "HMAC signing vs encryption — what is the difference?",
    answer:
      "HMAC provides authentication and integrity, not confidentiality. An HMAC tag proves who sent data and that it wasn't altered, but the data itself remains readable. Encryption provides confidentiality — hiding the content. For secure APIs, you often need both: encrypt the payload, then HMAC-sign it.",
  },
  {
    question: "Which HMAC variant should I use?",
    answer:
      "HMAC-SHA256 is the most common and is recommended for most applications. HMAC-SHA384 and HMAC-SHA512 provide larger output sizes (48 and 64 bytes respectively) and are used when longer MACs are required (e.g., high-security financial systems). All three are considered cryptographically secure.",
  },
  {
    question: "How is an HMAC key different from a JWT secret?",
    answer:
      "A JWT HS256 secret is an HMAC-SHA256 key — functionally identical. The difference is in how it's used: JWT libraries expect specific encoding and format conventions. This tool generates raw HMAC keys suitable for use as JWT secrets or general-purpose message authentication.",
  },
];

type KeyBits = 256 | 384 | 512;
type Format = "hex" | "base64url";

const BITS_OPTIONS = [
  { value: 256 as KeyBits, label: "256 bits" },
  { value: 384 as KeyBits, label: "384 bits" },
  { value: 512 as KeyBits, label: "512 bits" },
] as const;

const FORMAT_OPTIONS = [
  { value: "hex" as Format, label: "Hex" },
  { value: "base64url" as Format, label: "Base64URL" },
] as const;

async function generateKey(bits: KeyBits, format: Format): Promise<string> {
  const hex = await generateHMACKey(bits);
  if (format === "hex") return hex;
  // hex → bytes → base64url
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return toBase64Url(bytes);
}

export default function HmacKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [bits, setBits] = React.useState<KeyBits>(256);
  const [format, setFormat] = React.useState<Format>("hex");
  const [output, setOutput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generate = React.useCallback(async (b: KeyBits, fmt: Format) => {
    setIsGenerating(true);
    try {
      const result = await generateKey(b, fmt);
      setOutput(result);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    void generate(bits, format);
  }, [bits, format, generate]);

  const handleRegenerate = React.useCallback(() => {
    void generate(bits, format);
  }, [bits, format, generate]);

  const algorithm = bits === 256 ? "HMAC-SHA256" : bits === 384 ? "HMAC-SHA384" : "HMAC-SHA512";

  return (
    <ToolLayout
      toolId="hmac-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["aes-key", "jwt-secret", "encryption-key"]}
      securityNotes="HMAC keys are generated using SubtleCrypto. Keep them secret — anyone with the key can forge authenticated messages."
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
          filename="hmac-key"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Key size</p>
              <SegmentedControl
                options={BITS_OPTIONS}
                value={bits}
                onChange={(v) => setBits(v)}
                aria-label="HMAC key size"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Suitable for {algorithm}
              </p>
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
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
