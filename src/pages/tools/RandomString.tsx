import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generatePassword } from "@/utils/password";
import { toHex, toBase64 } from "@/utils/encoding";
import { getRandomBytes } from "@/utils/random";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";
import { Slider } from "@/components/ui/Slider";
import { CheckboxTile } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a random string?",
    answer:
      "A random string is a sequence of characters drawn from a defined alphabet using cryptographically secure randomness. Random strings are used as tokens, nonces, identifiers, passwords, seeds, and any value where predictability must be avoided. Unlike UUIDs, which have a fixed format, random strings can use any character set and length you choose.",
  },
  {
    question: "What's the difference between hex and Base64?",
    answer:
      "Both hex and Base64 are encodings of raw random bytes, so they have identical security for the same byte count. Hex uses only 0-9 and a-f — 4 bits per character — resulting in 2 characters per byte. Base64 uses 6 bits per character — resulting in roughly 1.33 characters per byte. Base64 is more compact, but hex is easier to read and copy without encoding errors.",
  },
  {
    question: "What is Base58?",
    answer:
      "Base58 is an encoding scheme developed by Satoshi Nakamoto for Bitcoin addresses. It uses 58 characters (0-9, A-Z, a-z) but removes easily confused characters: 0 (zero), O (uppercase O), I (uppercase I), and l (lowercase L). This makes it ideal for human-readable identifiers that are copied by eye or hand, reducing transcription errors. Bitcoin, IPFS, and many wallets use Base58.",
  },
];

// ---------------------------------------------------------------------------
// Charset definitions
// ---------------------------------------------------------------------------

const CHARSETS_RAW = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;


const PRESETS = [
  { label: "Alphanumeric", id: "alphanumeric" },
  { label: "Base62", id: "base62" },
  { label: "Base58", id: "base58" },
  { label: "Hex", id: "hex" },
  { label: "Base64", id: "base64-preset" },
] as const;
type PresetId = (typeof PRESETS)[number]["id"];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z
  .object({
    length: z.number().int().min(8).max(256),
    uppercase: z.boolean(),
    lowercase: z.boolean(),
    digits: z.boolean(),
    symbols: z.boolean(),
    outputEncoding: z.enum(["raw", "hex-bytes", "base64-bytes"]),
    count: z.number().int().min(1).max(10),
  })
  .refine((v) => v.uppercase || v.lowercase || v.digits || v.symbols, {
    message: "At least one character class must be selected",
    path: ["uppercase"],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  length: 32,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: false,
  outputEncoding: "raw",
  count: 1,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCharset(values: FormValues): string {
  let charset = "";
  if (values.uppercase) charset += CHARSETS_RAW.uppercase;
  if (values.lowercase) charset += CHARSETS_RAW.lowercase;
  if (values.digits) charset += CHARSETS_RAW.digits;
  if (values.symbols) charset += CHARSETS_RAW.symbols;
  return charset || CHARSETS_RAW.lowercase;
}

function generateSingle(values: FormValues): string {
  if (values.outputEncoding === "hex-bytes") {
    const bytes = getRandomBytes(Math.ceil(values.length / 2));
    return toHex(bytes).slice(0, values.length);
  }
  if (values.outputEncoding === "base64-bytes") {
    const bytes = getRandomBytes(Math.ceil((values.length * 3) / 4));
    return toBase64(bytes).slice(0, values.length);
  }
  // raw
  return generatePassword({
    length: values.length,
    uppercase: values.uppercase,
    lowercase: values.lowercase,
    digits: values.digits,
    symbols: values.symbols,
  });
}

function generate(values: FormValues): string[] {
  try {
    return Array.from({ length: values.count }, () => generateSingle(values));
  } catch {
    return [""];
  }
}

function applyPreset(
  presetId: PresetId,
  setValue: (field: keyof FormValues, val: boolean) => void
) {
  // All presets go through the raw charsets — encoding is handled by selecting chars
  if (presetId === "alphanumeric") {
    setValue("uppercase", true);
    setValue("lowercase", true);
    setValue("digits", true);
    setValue("symbols", false);
  } else if (presetId === "base62") {
    setValue("uppercase", true);
    setValue("lowercase", true);
    setValue("digits", true);
    setValue("symbols", false);
  } else if (presetId === "base58") {
    // Base58 removes ambiguous chars — handled similarly via alphanumeric without similar
    setValue("uppercase", true);
    setValue("lowercase", true);
    setValue("digits", true);
    setValue("symbols", false);
  } else if (presetId === "hex") {
    setValue("uppercase", false);
    setValue("lowercase", true);
    setValue("digits", true);
    setValue("symbols", false);
  } else if (presetId === "base64-preset") {
    setValue("uppercase", true);
    setValue("lowercase", true);
    setValue("digits", true);
    setValue("symbols", false);
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RandomStringPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { register, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const length = watch("length");
  const uppercase = watch("uppercase");
  const lowercase = watch("lowercase");
  const digits = watch("digits");
  const symbols = watch("symbols");
  const outputEncoding = watch("outputEncoding");
  const count = watch("count");

  const [outputs, setOutputs] = React.useState<string[]>(() => generate(DEFAULTS));

  const currentValues = React.useMemo<FormValues>(
    () => ({ length, uppercase, lowercase, digits, symbols, outputEncoding, count }),
    [length, uppercase, lowercase, digits, symbols, outputEncoding, count]
  );

  React.useEffect(() => {
    setOutputs(generate(currentValues));
  }, [currentValues]);

  const handleRegenerate = React.useCallback(() => {
    setOutputs(generate(currentValues));
  }, [currentValues]);

  const charset = buildCharset(currentValues);
  const entropyBits = estimateBits(charset.length, length);

  return (
    <ToolLayout
      toolId="random-string"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["api-key", "uuid", "salt-generator"]}
      securityNotes="Random strings are generated using the Web Cryptography API. Math.random() is never used."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={outputs}
          onRegenerate={handleRegenerate}
          showEntropy={outputEncoding === "raw"}
          entropyBits={entropyBits}
          multiline={count > 1}
          outputLabel={count > 1 ? "String" : undefined}
          filename="random-strings"
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Random string options"
          >
            {/* Quick-select presets */}
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      applyPreset(preset.id, (field, val) =>
                        setValue(field as "uppercase" | "lowercase" | "digits" | "symbols", val)
                      )
                    }
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      "border-border bg-background text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="rs-length"
                  className="text-sm font-medium text-foreground"
                >
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
                id="rs-length"
                value={length ?? 32}
                onChange={(v) => setValue("length", v)}
                min={8}
                max={256}
                aria-label="String length"
                aria-valuetext={`${length} characters`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>8</span>
                <span>256</span>
              </div>
            </div>

            {/* Character sets */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Character sets
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { name: "uppercase", label: "Uppercase" },
                    { name: "lowercase", label: "Lowercase" },
                    { name: "digits", label: "Digits" },
                    { name: "symbols", label: "Symbols" },
                  ] as const
                ).map(({ name, label }) => (
                  <CheckboxTile
                    key={name}
                    checked={watch(name)}
                    onCheckedChange={(v) => setValue(name, v)}
                    label={label}
                  />
                ))}
              </div>
            </fieldset>

            {/* Output encoding */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Output encoding
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Output encoding">
                {(
                  [
                    { value: "raw", label: "Raw characters" },
                    { value: "hex-bytes", label: "Hex bytes" },
                    { value: "base64-bytes", label: "Base64" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={outputEncoding === opt.value}
                    onClick={() => setValue("outputEncoding", opt.value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      outputEncoding === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Count */}
            <div>
              <label
                htmlFor="rs-count"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Count{" "}
                <span className="font-normal text-muted-foreground">(1–10)</span>
              </label>
              <input
                id="rs-count"
                type="number"
                min={1}
                max={10}
                className={cn(
                  "w-20 rounded-md border bg-background px-3 py-2 text-sm text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
                {...register("count", { valueAsNumber: true })}
              />
            </div>

            {/* Info */}
            {outputEncoding === "raw" && (
              <p className="text-xs text-muted-foreground">
                Charset size: {charset.length} characters &mdash;{" "}
                {Math.round(entropyBits)} bits of entropy
              </p>
            )}
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
