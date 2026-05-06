import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Timer } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePassword } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a temporary password?",
    answer:
      "A temporary password is a short-lived credential generated for initial account access, system provisioning, or delegation. It is intended to be changed or expired after first use. Common use cases include onboarding new employees, resetting a locked account, or granting emergency access.",
  },
  {
    question: "How secure should a temporary password be?",
    answer:
      "Even temporary passwords should be strong. A weak temporary password can be guessed before the user changes it. Use at least 12 characters with mixed character types. The key difference from permanent passwords is the lifecycle — not the strength.",
  },
  {
    question: "How should I transmit a temporary password?",
    answer:
      "Use a secure channel appropriate for your context: an internal secrets manager, an encrypted messaging platform, or an in-person handoff. Avoid sending temporary passwords via unencrypted email or SMS. Set an explicit expiry time and require immediate change on first login.",
  },
  {
    question: "Should the user change a temporary password immediately?",
    answer:
      "Yes — always. Configure your system to force a password change on first login when using temporary credentials. This ensures the password is only known to the intended user after the handoff window closes.",
  },
];

type Charset = "alphanumeric" | "full";

const CHARSET_OPTIONS = [
  { value: "alphanumeric" as Charset, label: "Alphanumeric" },
  { value: "full" as Charset, label: "Full" },
] as const;

export default function TemporaryPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [length, setLength] = React.useState(12);
  const [charset, setCharset] = React.useState<Charset>("alphanumeric");

  function doGenerate(l: number, cs: Charset): string {
    try {
      return generatePassword({
        length: l,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: cs === "full",
      });
    } catch {
      return "";
    }
  }

  const [output, setOutput] = React.useState<string>(() => doGenerate(12, "alphanumeric"));

  React.useEffect(() => {
    setOutput(doGenerate(length, charset));
  }, [length, charset]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(doGenerate(length, charset));
  }, [length, charset]);

  const entropyBits = estimateBits(
    charsetSizeForPassword({
      length,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: charset === "full",
    }),
    length
  );

  return (
    <ToolLayout
      toolId="temporary-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "recovery-key", "backup-codes"]}
      securityNotes="This password is intended for temporary use only. Expire or change it after first use. Never reuse temporary credentials."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
          <Timer className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Intended for temporary use. Expire or change after first use.</span>
        </div>

        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          showEntropy
          entropyBits={entropyBits}
          filename="temporary-password"
        >
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="tmp-length" className="text-sm font-medium text-foreground">
                  Length
                </label>
                <span
                  className="tabular-nums text-sm font-semibold text-foreground"
                  aria-live="polite"
                >
                  {length}
                </span>
              </div>
              <Slider
                id="tmp-length"
                value={length}
                onChange={setLength}
                min={8}
                max={16}
                aria-label="Password length"
                aria-valuetext={`${length} characters`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>8</span>
                <span>16</span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Character set</p>
              <SegmentedControl
                options={CHARSET_OPTIONS}
                value={charset}
                onChange={(v) => setCharset(v)}
                aria-label="Character set"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
