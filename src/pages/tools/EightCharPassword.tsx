import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { CheckboxTile } from "@/components/ui/Checkbox";
import { generatePassword } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Is 8 characters enough for a password?",
    answer:
      "Eight characters is the minimum considered acceptable by most security standards, but it is not recommended for important accounts. An 8-character password with all character types has about 52 bits of entropy — strong enough to resist online attacks, but potentially vulnerable to offline brute-force if a site's database is breached. Use 16+ characters for any account you care about.",
  },
  {
    question: "When is an 8-character password acceptable?",
    answer:
      "Eight characters may be acceptable for low-value accounts, temporary credentials, accounts with strict rate limiting and multi-factor authentication, or systems with their own expiry policies. Many legacy systems also enforce an 8-character maximum — in that case, use all available character types to maximize entropy within the constraint.",
  },
  {
    question: "Why not just use a longer password?",
    answer:
      "Some sites enforce maximum length limits (often legacy systems or poorly designed APIs). This tool targets those use cases. If the site allows longer passwords, use the main password generator and choose 16+ characters.",
  },
  {
    question: "How is this different from the main password generator?",
    answer:
      "This is a thin wrapper around the same password generator with the length locked to 8. The character sets are still configurable. Everything uses the same cryptographic randomness — window.crypto.getRandomValues.",
  },
];

export default function EightCharPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [digits, setDigits] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);

  const anyEnabled = uppercase || lowercase || digits || symbols;

  function doGenerate(): string {
    if (!anyEnabled) return "";
    try {
      return generatePassword({ length: 8, uppercase, lowercase, digits, symbols });
    } catch {
      return "";
    }
  }

  const [output, setOutput] = React.useState<string>(() => doGenerate());

  React.useEffect(() => {
    setOutput(doGenerate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppercase, lowercase, digits, symbols]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(doGenerate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppercase, lowercase, digits, symbols]);

  const entropyBits = estimateBits(
    charsetSizeForPassword({ length: 8, uppercase, lowercase, digits, symbols }),
    8
  );

  return (
    <ToolLayout
      toolId="8-char-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "16-char-password", "passphrase"]}
      securityNotes="8 characters is the minimum recommended length. Consider using a longer password whenever the site allows it."
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
          filename="8-char-password"
        >
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">Character sets</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CheckboxTile checked={uppercase} onCheckedChange={setUppercase} label="Uppercase" />
              <CheckboxTile checked={lowercase} onCheckedChange={setLowercase} label="Lowercase" />
              <CheckboxTile checked={digits} onCheckedChange={setDigits} label="Digits" />
              <CheckboxTile checked={symbols} onCheckedChange={setSymbols} label="Symbols" />
            </div>
          </fieldset>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
