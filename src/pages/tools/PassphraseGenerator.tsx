import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { Checkbox } from "@/components/ui/Checkbox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePassphrase } from "@/utils/password";
import { WORDLIST } from "@/data/wordlist";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Are passphrases stronger than passwords?",
    answer:
      "Passphrases are often both stronger and more memorable than traditional passwords. A 4-word passphrase from a 2048-word list has roughly 44 bits of entropy — comparable to a fully random 8-character password, but far easier to remember. With 6 words, you reach ~66 bits, which is very strong. Passphrases also resist common password-cracking heuristics that target keyboard patterns and substitutions like 'p@ssw0rd'.",
  },
  {
    question: "How many words should I use?",
    answer:
      "For most accounts, 4–5 words provide excellent security (44–55 bits of entropy with a 2048-word list). For critical systems like password manager master passwords or disk encryption keys, use 6–8 words. The NIST password guidelines (SP 800-63B) recommend passphrases as a strong authentication option. More words = more entropy = harder to crack.",
  },
  {
    question: "What word list do you use?",
    answer:
      "We use a subset of the EFF (Electronic Frontier Foundation) Large Wordlist, which was designed specifically for generating diceware-style passphrases. The EFF wordlist avoids offensive words, avoids words that are too similar to each other, and ensures each word is clearly pronounceable and distinct. Each word selection uses cryptographic randomness.",
  },
  {
    question: "Can I add my own words?",
    answer:
      "The current generator uses our curated word list to guarantee consistent entropy calculations. Custom word lists with unknown sizes or distributions would make entropy estimates unreliable. If you need a custom wordlist, we recommend using the EFF Large Wordlist (7776 words) directly and running diceware-style generation with a physical dice roll for air-gapped security.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SEPARATOR_OPTIONS = [
  { value: " ", label: "Space" },
  { value: "-", label: "Hyphen" },
  { value: "_", label: "Underscore" },
  { value: ".", label: "Dot" },
  { value: "", label: "None" },
  { value: "custom", label: "Custom" },
] as const;

const NUMBER_POSITION_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "random", label: "Random" },
] as const;

const schema = z.object({
  wordCount: z.number().int().min(3).max(10),
  separatorPreset: z.enum(["", " ", "-", "_", ".", "custom"]),
  customSeparator: z.string().max(10),
  capitalize: z.boolean(),
  includeNumber: z.boolean(),
  numberPosition: z.enum(["start", "end", "random"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  wordCount: 4,
  separatorPreset: " ",
  customSeparator: "-",
  capitalize: true,
  includeNumber: true,
  numberPosition: "random",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSeparator(values: FormValues): string {
  return values.separatorPreset === "custom"
    ? values.customSeparator
    : values.separatorPreset;
}

function generate(values: FormValues): string {
  try {
    return generatePassphrase(WORDLIST, {
      wordCount: values.wordCount,
      separator: resolveSeparator(values),
      capitalize: values.capitalize,
      includeNumber: values.includeNumber,
    });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PassphraseGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { register, control, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const values = useWatch({ control }) as FormValues;
  const [output, setOutput] = React.useState<string>(() => generate(DEFAULTS));

  React.useEffect(() => {
    setOutput(generate({ ...DEFAULTS, ...values }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.wordCount,
    values.separatorPreset,
    values.customSeparator,
    values.capitalize,
    values.includeNumber,
    values.numberPosition,
  ]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate({ ...DEFAULTS, ...values }));
  }, [values]);

  const wordCount = watch("wordCount");
  const separatorPreset = watch("separatorPreset");
  const includeNumber = watch("includeNumber");
  const numberPosition = watch("numberPosition");
  const entropyBits = estimateBits(WORDLIST.length, wordCount ?? DEFAULTS.wordCount);

  return (
    <ToolLayout
      toolId="passphrase"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "pin", "master-password"]}
      securityNotes="Passphrases are generated using the EFF Large Wordlist and the Web Cryptography API. No words are sent to any server."
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
          filename="passphrase"
        >
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()} aria-label="Passphrase options">

            {/* Word count */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="pp-word-count" className="text-sm font-medium text-foreground">
                  Word count
                </label>
                <span
                  className="tabular-nums text-sm font-semibold text-foreground"
                  aria-live="polite"
                  aria-label={`Current word count: ${wordCount}`}
                >
                  {wordCount}
                </span>
              </div>
              <Slider
                id="pp-word-count"
                value={wordCount ?? DEFAULTS.wordCount}
                onChange={(v) => setValue("wordCount", v)}
                min={3}
                max={10}
                aria-label="Word count"
                aria-valuetext={`${wordCount} words`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>3 words</span>
                <span>10 words</span>
              </div>
            </div>

            {/* Separator */}
            <div>
              <label htmlFor="pp-separator" className="mb-1.5 block text-sm font-medium text-foreground">
                Separator
              </label>
              <select
                id="pp-separator"
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
                {...register("separatorPreset")}
              >
                {SEPARATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {separatorPreset === "custom" && (
                <div className="mt-2">
                  <label htmlFor="pp-custom-sep" className="sr-only">
                    Custom separator
                  </label>
                  <input
                    id="pp-custom-sep"
                    type="text"
                    maxLength={10}
                    placeholder="Enter separator…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    {...register("customSeparator")}
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">Options</legend>
              <div className="space-y-3">
                <Checkbox
                  checked={watch("capitalize")}
                  onCheckedChange={(v) => setValue("capitalize", v)}
                  label="Capitalize first letter of each word"
                />
                <Checkbox
                  checked={watch("includeNumber")}
                  onCheckedChange={(v) => setValue("includeNumber", v)}
                  label="Include a number"
                />
              </div>
            </fieldset>

            {/* Number position */}
            {includeNumber && (
              <fieldset>
                <legend className="mb-3 text-sm font-medium text-foreground">Number position</legend>
                <SegmentedControl
                  options={NUMBER_POSITION_OPTIONS}
                  value={numberPosition ?? "random"}
                  onChange={(v) => setValue("numberPosition", v)}
                  aria-label="Number position"
                />
              </fieldset>
            )}

            <p className="text-xs text-muted-foreground">
              {WORDLIST.length.toLocaleString()} word pool &mdash; {Math.round(entropyBits)} bits of entropy
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
