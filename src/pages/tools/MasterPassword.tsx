import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePassword, generatePassphrase } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

// Small EFF-style word list for passphrase mode (subset)
const WORDS = [
  "abandon","ability","about","above","absent","absorb","abstract","absurd","abuse","access",
  "account","achieve","across","action","actual","adapt","address","adjust","admit","adult",
  "advance","advice","afford","afraid","again","agency","agree","ahead","allow","almost",
  "alone","alter","amaze","anchor","angel","angry","animal","annual","answer","anyone",
  "apart","appeal","apple","apply","argue","arise","armor","arrange","arrive","aspect",
  "assemble","assert","assign","assist","assume","asylum","athlete","attack","attend","attract",
  "auction","author","average","aware","awful","bacon","badge","balance","bamboo","banana",
  "barely","battle","beauty","because","become","before","behave","believe","benefit","better",
  "blanket","blossom","border","boring","bounce","brave","bridge","bright","broken","bronze",
  "bullet","bundle","burden","candle","captain","carbon","careful","carpet","castle","catalog",
];

const STYLE_OPTIONS = [
  { value: "random" as const, label: "Random" },
  { value: "passphrase" as const, label: "Passphrase" },
];

type Style = "random" | "passphrase";

const LENGTH_OPTIONS = [
  { value: 20, label: "20" },
  { value: 24, label: "24" },
  { value: 32, label: "32" },
  { value: 48, label: "48" },
] as const;

type LengthOpt = 20 | 24 | 32 | 48;

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a master password?",
    answer:
      "A master password is the single high-entropy credential that unlocks all other passwords in a password manager like 1Password, Bitwarden, or KeePass. Because it protects everything else, it must be exceptionally strong, unique, and memorized — never stored anywhere a machine can read it automatically.",
  },
  {
    question: "How long should a master password be?",
    answer:
      "At least 20 characters for random passwords, or 6–8 words for passphrases. Security experts generally recommend 32+ random characters for maximum protection. Both formats shown here exceed the 80-bit entropy threshold considered strong by NIST and most security researchers.",
  },
  {
    question: "How should I store my master password?",
    answer:
      "The master password should be memorized, not stored digitally. Write it on paper and keep physical copies in two geographically separate secure locations (e.g., a home safe and a bank safety deposit box). Never store it in email, cloud notes, or another password manager.",
  },
  {
    question: "What if I forget my master password?",
    answer:
      "Most password managers cannot recover your master password — this is a deliberate security feature, not a bug. Generate backup codes or a recovery key through your password manager and store them separately. If lost, you may lose access to all stored passwords permanently.",
  },
];

function generateRandom(length: LengthOpt): string {
  return generatePassword({
    length,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
  });
}

function generatePhrase(): string {
  return generatePassphrase(WORDS, {
    wordCount: 6,
    separator: "-",
    capitalize: true,
    includeNumber: true,
  });
}

export default function MasterPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [style, setStyle] = React.useState<Style>("random");
  const [length, setLength] = React.useState<LengthOpt>(32);
  const [output, setOutput] = React.useState<string>(() => generateRandom(32));

  const doGenerate = React.useCallback((s: Style, l: LengthOpt) => {
    if (s === "passphrase") {
      setOutput(generatePhrase());
    } else {
      setOutput(generateRandom(l));
    }
  }, []);

  React.useEffect(() => {
    doGenerate(style, length);
  }, [style, length, doGenerate]);

  const handleRegenerate = React.useCallback(() => {
    doGenerate(style, length);
  }, [style, length, doGenerate]);

  const entropyBits = style === "passphrase"
    ? estimateBits(WORDS.length, 6) + estimateBits(10, 1)
    : estimateBits(charsetSizeForPassword({ length, uppercase: true, lowercase: true, digits: true, symbols: true }), length);

  return (
    <ToolLayout
      toolId="master-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["passphrase", "password", "backup-codes"]}
      securityNotes="Your master password is the key to all your other passwords. Never share it, never type it into a website other than your password manager, and store physical backups in a secure location."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/50 dark:bg-yellow-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Store this in a secure location. Never share it. If lost, it cannot be recovered.
          </p>
        </div>

        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          showEntropy
          entropyBits={entropyBits}
          filename="master-password"
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Style</p>
              <SegmentedControl
                options={STYLE_OPTIONS}
                value={style}
                onChange={(v) => setStyle(v)}
                aria-label="Password style"
              />
            </div>
            {style === "random" && (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">Length</p>
                <SegmentedControl
                  options={LENGTH_OPTIONS}
                  value={length}
                  onChange={(v) => setLength(v)}
                  aria-label="Password length"
                />
              </div>
            )}
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
