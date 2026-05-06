import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { getRandomBytes } from "@/utils/random";
import { toHex, toBase64, toBase64Url } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Flask's secret_key used for?",
    answer:
      "Flask uses secret_key to sign session cookies using HMAC-SHA1. Without a secret key, Flask's session mechanism does not work. The key must remain secret — if exposed, an attacker can forge session cookies and impersonate any user.",
  },
  {
    question: "How do I set the Flask secret key?",
    answer:
      "Set it in your application: app.secret_key = 'your-key-here'. For production, load from environment: import os; app.secret_key = os.environ['FLASK_SECRET_KEY']. Never hardcode it in committed code.",
  },
  {
    question: "How long should a Flask secret key be?",
    answer:
      "Flask documentation recommends at least 16 bytes (128 bits). For production applications, use 32 bytes (256 bits) or more. Longer keys provide more security against brute-force attacks on the HMAC signature.",
  },
  {
    question: "When should I rotate the secret key?",
    answer:
      "Rotate when the key may be compromised, team access changes, or during security audits. Like Django, rotating the Flask secret key invalidates all existing sessions — all users will be logged out immediately.",
  },
];

type Encoding = "hex" | "base64" | "base64url";
type KeyLength = 16 | 24 | 32;

const ENCODING_OPTIONS = [
  { value: "hex" as Encoding, label: "Hex" },
  { value: "base64" as Encoding, label: "Base64" },
  { value: "base64url" as Encoding, label: "Base64URL" },
] as const;

const LENGTH_OPTIONS = [
  { value: 16 as KeyLength, label: "16 bytes" },
  { value: 24 as KeyLength, label: "24 bytes" },
  { value: 32 as KeyLength, label: "32 bytes" },
] as const;

function generateFlaskSecret(bytes: KeyLength, encoding: Encoding): string {
  const raw = getRandomBytes(bytes);
  switch (encoding) {
    case "hex": return toHex(raw);
    case "base64": return toBase64(raw);
    case "base64url": return toBase64Url(raw);
  }
}

export default function FlaskSecretPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [keyLength, setKeyLength] = React.useState<KeyLength>(32);
  const [encoding, setEncoding] = React.useState<Encoding>("hex");
  const [key, setKey] = React.useState<string>(() => generateFlaskSecret(32, "hex"));

  React.useEffect(() => {
    setKey(generateFlaskSecret(keyLength, encoding));
  }, [keyLength, encoding]);

  const handleRegenerate = React.useCallback(() => {
    setKey(generateFlaskSecret(keyLength, encoding));
  }, [keyLength, encoding]);

  const formatted = `app.secret_key = '${key}'`;

  return (
    <ToolLayout
      toolId="flask-secret"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["django-secret", "laravel-app-key", "jwt-secret"]}
      securityNotes="Never commit your secret_key to version control. Load it from environment variables in production deployments."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={formatted}
          onRegenerate={handleRegenerate}
          outputLabel="Python"
          filename="flask-secret-key"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Key length</p>
              <SegmentedControl
                options={LENGTH_OPTIONS}
                value={keyLength}
                onChange={(v) => setKeyLength(v)}
                aria-label="Key length in bytes"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Encoding</p>
              <SegmentedControl
                options={ENCODING_OPTIONS}
                value={encoding}
                onChange={(v) => setEncoding(v)}
                aria-label="Key encoding format"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
