import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generatePIN, generatePassword } from "@/utils/password";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What length PIN should I use?",
    answer:
      "For device unlock PINs, 6 digits is the modern standard — Apple and Google both recommend 6+ digits. A 6-digit PIN has 1 million possible combinations vs. 10,000 for a 4-digit PIN. For high-security contexts like bank vault combinations or secure facility access, use 8–10 digits. If the system locks after failed attempts (which it should), even 6 digits with a lockout provides strong protection.",
  },
  {
    question: "Are PINs secure?",
    answer:
      "PINs are only secure when combined with lockout mechanisms and rate limiting. A 4-digit PIN alone has just 10,000 combinations and can be brute-forced in seconds without a lockout. What makes device PINs secure is that the device locks or wipes after 5–10 failed attempts. Never use a PIN for online accounts without lockout protection. For high-value accounts, use a full password or passphrase instead.",
  },
  {
    question: "Should I use a 4 or 6 digit PIN?",
    answer:
      "Always prefer 6 digits when the system supports it. 6-digit PINs are 100 times harder to guess than 4-digit PINs and are the current recommendation from NIST and major platform vendors (Apple, Google, Microsoft). If you must use 4 digits, avoid obvious sequences: 1234, 0000, 1111, your birth year, or reversed dates. Our generator uses cryptographic randomness to avoid these patterns.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const PIN_LENGTHS = [4, 6, 8, 10] as const;
type PinLength = (typeof PIN_LENGTHS)[number];

const PIN_TYPES = [
  { value: "digits", label: "Digits only" },
  { value: "digits-letters", label: "Digits + Letters" },
  { value: "digits-letters-symbols", label: "Digits + Letters + Symbols" },
] as const;
type PinType = (typeof PIN_TYPES)[number]["value"];

const schema = z.object({
  length: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)]),
  type: z.enum(["digits", "digits-letters", "digits-letters-symbols"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { length: 6, type: "digits" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generate(length: PinLength, type: PinType): string {
  try {
    if (type === "digits") {
      return generatePIN(length);
    }
    return generatePassword({
      length,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: type === "digits-letters-symbols",
    });
  } catch {
    return "";
  }
}

function calcCharsetSize(type: PinType): number {
  if (type === "digits") return 10;
  if (type === "digits-letters") return 62; // 26+26+10
  return 90; // roughly: 62 + ~28 symbols
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PinGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const length = watch("length");
  const type = watch("type");

  const [output, setOutput] = React.useState<string>(() =>
    generate(DEFAULTS.length, DEFAULTS.type)
  );

  React.useEffect(() => {
    setOutput(generate(length, type));
  }, [length, type]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate(length, type));
  }, [length, type]);

  const charsetSize = calcCharsetSize(type);
  const entropyBits = estimateBits(charsetSize, length);

  return (
    <ToolLayout
      toolId="pin"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "backup-codes", "passphrase"]}
      securityNotes="PINs are generated using cryptographically secure randomness via the Web Cryptography API. Math.random() is never used."
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
          filename="pin"
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="PIN options"
          >
            {/* Length */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Length
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="PIN length">
                {PIN_LENGTHS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={length === l}
                    onClick={() => setValue("length", l)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      length === l
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {l} digits
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Type */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Type
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="PIN type">
                {PIN_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={type === opt.value}
                    onClick={() => setValue("type", opt.value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      type === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              Charset size: {charsetSize} characters &mdash;{" "}
              {Math.round(entropyBits)} bits of entropy
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
