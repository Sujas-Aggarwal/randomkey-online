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
    question: "What is a recovery key?",
    answer:
      "A recovery key is a long, randomly generated credential that serves as the ultimate fallback for account access. Unlike backup codes (which are single-use), a recovery key is a single persistent credential — similar to how Apple Recovery Key works for Apple ID accounts with Advanced Data Protection enabled.",
  },
  {
    question: "Where should I store my recovery key?",
    answer:
      "Store it offline: print it out and keep it in a secure location such as a fireproof safe. You can also store it in a bank safety deposit box. Never store it in a cloud service that the key is meant to protect. Having two physical copies in different locations is the safest approach.",
  },
  {
    question: "How is this different from a password?",
    answer:
      "A recovery key is specifically designed for emergency access — it's longer than a typical password, never memorized, and treated as a physical document. It provides full access with a single credential, bypassing other authentication factors. Protect it accordingly.",
  },
  {
    question: "When should I regenerate my recovery key?",
    answer:
      "Regenerate your recovery key if: you believe it may have been compromised, you've updated your security settings, you've used the key for recovery, or someone who knew its location no longer should have access. Always update the stored copy after regeneration.",
  },
];

type Format = "grouped" | "ungrouped" | "hex";

const FORMAT_OPTIONS = [
  { value: "grouped" as Format, label: "Grouped" },
  { value: "ungrouped" as Format, label: "Ungrouped" },
  { value: "hex" as Format, label: "Hex" },
] as const;

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateGrouped(): string {
  // 6 groups of 4 chars from alphanumeric = 24 chars
  const groups: string[] = [];
  for (let g = 0; g < 6; g++) {
    const bytes = getRandomBytes(4);
    let group = "";
    for (const byte of bytes) {
      group += ALPHANUM[byte % ALPHANUM.length];
    }
    groups.push(group);
  }
  return groups.join("-");
}

function generateRecoveryKey(format: Format): string {
  switch (format) {
    case "grouped":
      return generateGrouped();
    case "ungrouped":
      return generateGrouped().replace(/-/g, "");
    case "hex": {
      const bytes = getRandomBytes(24);
      return toHex(bytes).toUpperCase();
    }
  }
}

export default function RecoveryKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [format, setFormat] = React.useState<Format>("grouped");
  const [output, setOutput] = React.useState<string>(() => generateRecoveryKey("grouped"));

  React.useEffect(() => {
    setOutput(generateRecoveryKey(format));
  }, [format]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateRecoveryKey(format));
  }, [format]);

  return (
    <ToolLayout
      toolId="recovery-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["backup-codes", "master-password", "password"]}
      securityNotes="Store this recovery key in a secure physical location. Anyone with this key can access your account — treat it like a physical key to your front door."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          filename="recovery-key"
          exportFormats={["txt"]}
        >
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Format</p>
            <SegmentedControl
              options={FORMAT_OPTIONS}
              value={format}
              onChange={(v) => setFormat(v)}
              aria-label="Recovery key format"
            />
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
