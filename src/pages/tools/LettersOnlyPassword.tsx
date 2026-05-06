import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { generatePassword } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "When is a letters-only password appropriate?",
    answer:
      "Letters-only passwords are useful when entering credentials on systems that don't accept numbers or symbols (some telephony systems, older hardware), when dictating a password aloud, or when a system enforces strict character type rules. They're also common in passphrases where all components are words.",
  },
  {
    question: "How does removing digits and symbols affect security?",
    answer:
      "Removing digits and symbols reduces the character pool from ~94 to 52 (26 uppercase + 26 lowercase). For a 16-character letters-only password, this gives about 90 bits of entropy — still excellent for most accounts. Increase length to compensate: a 20-character letters-only password has 112 bits of entropy.",
  },
  {
    question: "Are letters-only passwords easier to brute-force?",
    answer:
      "Yes, relative to passwords using the full character set. However, the length is the dominant factor. A 20-character letters-only password is orders of magnitude stronger than an 8-character password with all character types. Length beats character variety in terms of entropy.",
  },
  {
    question: "Is this the same as a passphrase?",
    answer:
      "No. A letters-only password is a random sequence of individual letters — not pronounceable words. Passphrases use real dictionary words separated by a delimiter. Both approaches exclude numbers and symbols, but passphrases are far more memorable. Use the Passphrase Generator if memorability is important.",
  },
];

export default function LettersOnlyPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState(20);

  function doGenerate(l: number): string {
    try {
      return generatePassword({ length: l, uppercase: true, lowercase: true, digits: false, symbols: false });
    } catch {
      return "";
    }
  }

  const [output, setOutput] = React.useState<string>(() => doGenerate(20));

  React.useEffect(() => {
    setOutput(doGenerate(length));
  }, [length]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(doGenerate(length));
  }, [length]);

  const entropyBits = estimateBits(
    charsetSizeForPassword({ length, uppercase: true, lowercase: true, digits: false, symbols: false }),
    length
  );

  return (
    <ToolLayout
      toolId="letters-only-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "no-symbols-password", "passphrase"]}
      securityNotes="Letters-only passwords have a smaller character pool. Use a length of 20+ characters to maintain strong entropy."
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
          filename="letters-only-password"
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="lo-length" className="text-sm font-medium text-foreground">
                Length
              </label>
              <span
                className="tabular-nums text-sm font-semibold text-foreground"
                aria-live="polite"
                aria-label={`Current length: ${length}`}
              >
                {length}
              </span>
            </div>
            <Slider
              id="lo-length"
              value={length}
              onChange={setLength}
              min={8}
              max={64}
              aria-label="Password length"
              aria-valuetext={`${length} characters`}
            />
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
              <span>8</span>
              <span>64</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              52 character pool (A–Z, a–z) &mdash; {Math.round(entropyBits)} bits of entropy
            </p>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
