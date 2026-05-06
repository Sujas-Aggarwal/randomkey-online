import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { CheckboxTile } from "@/components/ui/Checkbox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePassword } from "@/utils/password";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "When do I need bulk password generation?",
    answer:
      "Bulk generation is useful when provisioning multiple user accounts, resetting credentials for a team, generating one-time passwords for distribution, or seeding test databases with unique passwords. Each password is independently generated with its own cryptographic randomness.",
  },
  {
    question: "Are all passwords unique?",
    answer:
      "Yes. Each password is generated independently using window.crypto.getRandomValues, giving each its own entropy. With a 16-character password using all character sets, the probability of any two matching is astronomically small — effectively zero for any practical batch size.",
  },
  {
    question: "How should I distribute these passwords securely?",
    answer:
      "Export the file, then share each password through a secure channel (encrypted email, a secrets manager, or a one-time link service). Never send passwords in plain text via SMS or standard email. Consider using a password manager that supports bulk import.",
  },
  {
    question: "Can I import these into a password manager?",
    answer:
      "Most password managers support CSV or plain-text import. Export as .txt with one password per line, then pair each with the appropriate username and URL in your manager's import tool. Check your manager's documentation for the exact format required.",
  },
];

const COUNT_OPTIONS = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
] as const;

type Count = 5 | 10 | 20 | 50;

function generateBulk(count: Count, length: number, opts: { uppercase: boolean; lowercase: boolean; digits: boolean; symbols: boolean }): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      results.push(generatePassword({ length, ...opts }));
    } catch {
      results.push("");
    }
  }
  return results;
}

export default function BulkPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = React.useState<Count>(10);
  const [length, setLength] = React.useState(16);
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [digits, setDigits] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);
  const [output, setOutput] = React.useState<string[]>(() =>
    generateBulk(10, 16, { uppercase: true, lowercase: true, digits: true, symbols: true })
  );

  const anyEnabled = uppercase || lowercase || digits || symbols;

  React.useEffect(() => {
    if (!anyEnabled) return;
    setOutput(generateBulk(count, length, { uppercase, lowercase, digits, symbols }));
  }, [count, length, uppercase, lowercase, digits, symbols, anyEnabled]);

  const handleRegenerate = React.useCallback(() => {
    if (!anyEnabled) return;
    setOutput(generateBulk(count, length, { uppercase, lowercase, digits, symbols }));
  }, [count, length, uppercase, lowercase, digits, symbols, anyEnabled]);

  return (
    <ToolLayout
      toolId="bulk-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "pin"]}
      securityNotes="Each password is generated independently with cryptographic randomness. Export and store them securely. Never transmit passwords in plaintext."
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
          filename="bulk-passwords"
          exportFormats={["txt", "json"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of passwords to generate"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="bulk-length" className="text-sm font-medium text-foreground">
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
                id="bulk-length"
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

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">Character sets</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <CheckboxTile checked={uppercase} onCheckedChange={setUppercase} label="Uppercase" />
                <CheckboxTile checked={lowercase} onCheckedChange={setLowercase} label="Lowercase" />
                <CheckboxTile checked={digits} onCheckedChange={setDigits} label="Digits" />
                <CheckboxTile checked={symbols} onCheckedChange={setSymbols} label="Symbols" />
              </div>
            </fieldset>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
