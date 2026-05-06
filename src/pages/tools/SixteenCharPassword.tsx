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
    question: "Why is 16 characters the recommended standard?",
    answer:
      "A 16-character password using all character types has approximately 104 bits of entropy, far exceeding the 80-bit threshold that NIST considers sufficient for most applications. At this length, even a powerful GPU cluster would take millions of years to crack the password through brute force.",
  },
  {
    question: "Is 16 characters sufficient for all use cases?",
    answer:
      "For most online accounts and everyday security needs, yes. For high-value targets like password manager master passwords, encryption keys, or administrative credentials, consider 20–32 characters. The longer the password, the more secure it is against future improvements in computing power.",
  },
  {
    question: "Should I use all character types?",
    answer:
      "Yes, when the site allows it. Including uppercase, lowercase, digits, and symbols maximizes the character pool (about 94 characters) which directly increases entropy. Removing any class reduces security — but even with just uppercase and lowercase (52 chars) at 16 characters, you still get ~90 bits of entropy.",
  },
  {
    question: "How does this compare to a passphrase?",
    answer:
      "A 16-character random password and a 5-word diceware passphrase offer similar entropy (~90–100 bits). Passphrases are easier to memorize; random passwords are harder to guess with dictionary attacks. Use whichever you can remember — or store both in a password manager.",
  },
];

export default function SixteenCharPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [digits, setDigits] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);

  const anyEnabled = uppercase || lowercase || digits || symbols;

  function doGenerate(): string {
    if (!anyEnabled) return "";
    try {
      return generatePassword({ length: 16, uppercase, lowercase, digits, symbols });
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
    charsetSizeForPassword({ length: 16, uppercase, lowercase, digits, symbols }),
    16
  );

  return (
    <ToolLayout
      toolId="16-char-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "8-char-password", "passphrase"]}
      securityNotes="16 characters is the recommended minimum for important accounts. All generation uses window.crypto.getRandomValues — never Math.random()."
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
          filename="16-char-password"
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
