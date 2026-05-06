import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePronounceablePassword } from "@/utils/password";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What makes a password pronounceable?",
    answer:
      "Pronounceable passwords alternate consonants and vowels in a pattern that mimics natural language syllable structure. This makes them easier to read aloud, type, and remember while still using cryptographic randomness for the character selection.",
  },
  {
    question: "Are pronounceable passwords less secure?",
    answer:
      "Compared to fully random passwords of the same length, pronounceable passwords have slightly lower entropy because they draw from smaller character pools per position. However, they can be made more secure by increasing length. A 20-character pronounceable password still provides strong security for most use cases.",
  },
  {
    question: "When should I use a pronounceable password?",
    answer:
      "Pronounceable passwords are ideal when you need to read a password aloud (e.g., telling a colleague a temporary credential), type it on a mobile device, or remember it briefly without a password manager. For long-term storage, any strong password works equally well.",
  },
  {
    question: "How is the randomness generated?",
    answer:
      "All character selection uses window.crypto.getRandomValues — the same cryptographic RNG used in browsers for TLS and key generation. Math.random() is never used. The pronounceable structure constrains which characters appear at each position, but the selection within each set is cryptographically uniform.",
  },
];

const COUNT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 3, label: "3" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
] as const;

type Count = 1 | 3 | 5 | 10;

function generate(length: number, count: Count): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generatePronounceablePassword(length));
  }
  return results;
}

export default function PronounceablePasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState(12);
  const [count, setCount] = React.useState<Count>(1);
  const [output, setOutput] = React.useState<string[]>(() => generate(12, 1));

  React.useEffect(() => {
    setOutput(generate(length, count));
  }, [length, count]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate(length, count));
  }, [length, count]);

  // Rough entropy: consonant pool (21) for even positions, vowel pool (5) for odd
  const avgPoolSize = (21 + 5) / 2;
  const entropyBits = estimateBits(avgPoolSize, length);

  return (
    <ToolLayout
      toolId="pronounceable-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "memorable-password"]}
      securityNotes="Pronounceable passwords have lower entropy per character than fully random passwords. Use longer lengths (16+) for high-security accounts."
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
          filename="pronounceable-password"
          multiline={count > 1}
        >
          <div className="space-y-6" aria-label="Pronounceable password options">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="pp-length" className="text-sm font-medium text-foreground">
                  Length
                </label>
                <span
                  className="tabular-nums text-sm font-semibold text-foreground min-w-[2ch] text-right"
                  aria-live="polite"
                  aria-label={`Current length: ${length}`}
                >
                  {length}
                </span>
              </div>
              <Slider
                id="pp-length"
                value={length}
                onChange={setLength}
                min={8}
                max={32}
                aria-label="Password length"
                aria-valuetext={`${length} characters`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>8</span>
                <span>32</span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of passwords"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
