import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { getRandomBytes } from "@/utils/random";
import { toHex } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are backup codes?",
    answer:
      "Backup codes are one-time use emergency credentials that let you access your account if you lose your primary two-factor authentication device. Services like Google, GitHub, and Stripe provide a set of 8–12 codes — each can only be used once, after which it becomes invalid.",
  },
  {
    question: "How should I store backup codes?",
    answer:
      "Print them out and store the paper in a secure location (a safe or locked filing cabinet). You can also write them in a physical notebook. Do not store them in the same password manager that they're intended to protect. Keep at least two physical copies in different locations.",
  },
  {
    question: "What should I do when I use a backup code?",
    answer:
      "After using a backup code, generate a new set immediately and replace the old ones in your account settings. Most services invalidate all remaining codes when you regenerate. Mark used codes on your physical copy so you know how many remain.",
  },
  {
    question: "What happens when I run out of backup codes?",
    answer:
      "Once all codes are used, you will need alternative recovery methods (like contacting support with ID verification). Always regenerate codes when you're running low. Treat each code like a one-time-use key — use it only in emergencies.",
  },
];

type Count = 8 | 10 | 12;
type Format = "8-char" | "4-4-dash" | "6-digit";

const COUNT_OPTIONS = [
  { value: 8 as Count, label: "8" },
  { value: 10 as Count, label: "10" },
  { value: 12 as Count, label: "12" },
] as const;

const FORMAT_OPTIONS = [
  { value: "8-char" as Format, label: "XXXXXXXX" },
  { value: "4-4-dash" as Format, label: "XXXX-XXXX" },
  { value: "6-digit" as Format, label: "6 Digits" },
] as const;

function generateCode(format: Format): string {
  switch (format) {
    case "8-char": {
      const bytes = getRandomBytes(4);
      return toHex(bytes).toUpperCase();
    }
    case "4-4-dash": {
      const bytes = getRandomBytes(4);
      const hex = toHex(bytes).toUpperCase();
      return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
    }
    case "6-digit": {
      const bytes = getRandomBytes(4);
      const num = new DataView(bytes.buffer).getUint32(0, false);
      return (num % 1000000).toString().padStart(6, "0");
    }
  }
}

function generateCodes(count: Count, format: Format): string[] {
  return Array.from({ length: count }, (_, i) => `${(i + 1).toString().padStart(2, " ")}. ${generateCode(format)}`);
}

export default function BackupCodesPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = React.useState<Count>(8);
  const [format, setFormat] = React.useState<Format>("4-4-dash");
  const [output, setOutput] = React.useState<string[]>(() => generateCodes(8, "4-4-dash"));

  React.useEffect(() => {
    setOutput(generateCodes(count, format));
  }, [count, format]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateCodes(count, format));
  }, [count, format]);

  return (
    <ToolLayout
      toolId="backup-codes"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["recovery-key", "totp-2fa", "password"]}
      securityNotes="Store these codes in a secure physical location. Each code can only be used once. Regenerate new codes if any are lost or compromised."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          multiline
          filename="backup-codes"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of backup codes"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Format</p>
              <SegmentedControl
                options={FORMAT_OPTIONS}
                value={format}
                onChange={(v) => setFormat(v)}
                aria-label="Code format"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
