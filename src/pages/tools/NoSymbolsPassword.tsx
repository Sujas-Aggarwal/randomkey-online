import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { Checkbox } from "@/components/ui/Checkbox";
import { generatePassword } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import { getRandomInt } from "@/utils/random";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Why do some sites not allow symbols?",
    answer:
      "Many legacy systems, banking portals, and older web applications restrict special characters because their backend systems were not built to handle them safely — some SQL queries or HTML templates can break when symbols appear in input fields. While modern systems properly escape all input, many sites still enforce alphanumeric-only policies.",
  },
  {
    question: "Is a no-symbols password less secure?",
    answer:
      "Yes, slightly — removing the symbol set (about 28 characters) reduces the pool from ~94 to ~62 characters per position. For a 16-character password, this reduces entropy from about 104 bits to about 95 bits. Both are still very strong; compensate by using a slightly longer length if you're concerned.",
  },
  {
    question: "What character sets are included?",
    answer:
      "This generator uses uppercase letters (A–Z), lowercase letters (a–z), and digits (0–9) — 62 characters total. Symbols like !@#$%^&* are excluded. You can optionally exclude similar-looking characters (0, O, 1, l) to make the password easier to read and type.",
  },
  {
    question: "Can I use this for WiFi passwords?",
    answer:
      "Yes. WPA2 and WPA3 accept alphanumeric passwords, and many home router interfaces reject symbols. A 20-character alphanumeric password provides strong WiFi security. Alternatively, use the dedicated WiFi Password Generator for format-optimized output.",
  },
];

export default function NoSymbolsPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState(16);
  const [excludeSimilar, setExcludeSimilar] = React.useState(false);

  const SIMILAR_POOL = "0O1lI";
  const FULL_ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  function doGenerate(): string {
    try {
      if (excludeSimilar) {
        // Generate inline using filtered pool
        const pool = FULL_ALPHANUM.split("").filter((c) => !SIMILAR_POOL.includes(c)).join("");
        let result = "";
        for (let i = 0; i < length; i++) {
          result += pool[getRandomInt(0, pool.length)];
        }
        return result;
      }
      return generatePassword({
        length,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: false,
      });
    } catch {
      return "";
    }
  }

  const [output, setOutput] = React.useState<string>(() => doGenerate());

  React.useEffect(() => {
    setOutput(doGenerate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, excludeSimilar]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(doGenerate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, excludeSimilar]);

  const effectivePoolSize = excludeSimilar
    ? 62 - 5 // remove 0, O, 1, l, I
    : charsetSizeForPassword({ length, uppercase: true, lowercase: true, digits: true, symbols: false });
  const entropyBits = estimateBits(effectivePoolSize, length);

  return (
    <ToolLayout
      toolId="no-symbols-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "letters-only-password", "passphrase"]}
      securityNotes="Symbols are excluded from this password. Consider using a longer length to compensate for the reduced character pool."
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
          filename="no-symbols-password"
        >
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="ns-length" className="text-sm font-medium text-foreground">
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
                id="ns-length"
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
            </div>

            <Checkbox
              checked={excludeSimilar}
              onCheckedChange={setExcludeSimilar}
              label="Exclude similar characters"
              description={<span className="font-mono">0, O, 1, l, I</span>}
            />
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
