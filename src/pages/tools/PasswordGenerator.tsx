import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { CheckboxTile, Checkbox } from "@/components/ui/Checkbox";
import { generatePassword } from "@/utils/password";
import { charsetSizeForPassword, estimateBits } from "@/utils/entropy";
import type { PasswordOptions } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How long should my password be?",
    answer:
      "Security experts recommend a minimum of 16 characters for most accounts. For high-value accounts like email or financial services, use 20+ characters. Longer passwords exponentially increase the number of possible combinations, making brute-force attacks impractical. A 16-character password with mixed character types has over 95 quadrillion possible combinations.",
  },
  {
    question: "What makes a password secure?",
    answer:
      "A secure password combines length, unpredictability, and character variety. It should be randomly generated (not based on words, names, or patterns), at least 16 characters long, include uppercase, lowercase, digits, and symbols, and be unique to each account. Never reuse passwords across services — if one site is breached, attackers try the same password everywhere else.",
  },
  {
    question: "Is this password generator safe?",
    answer:
      "Yes. All passwords are generated entirely inside your browser using the Web Cryptography API (window.crypto.getRandomValues), which is the same standard used by security-critical applications. Your passwords are never sent to any server, logged, or stored. The source code is open and auditable. We use cryptographically secure randomness — never Math.random().",
  },
  {
    question: "Can I use this offline?",
    answer:
      "Yes. After your first visit, randomkey.online works fully offline as a Progressive Web App. All generation happens locally in your browser, so there is no server dependency. You can also install it to your home screen for instant access without opening a browser tab.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z
  .object({
    length: z.number().int().min(8).max(128),
    uppercase: z.boolean(),
    lowercase: z.boolean(),
    digits: z.boolean(),
    symbols: z.boolean(),
    excludeSimilar: z.boolean(),
    excludeAmbiguous: z.boolean(),
    customSymbols: z.string().max(50),
  })
  .refine((v) => v.uppercase || v.lowercase || v.digits || v.symbols, {
    message: "At least one character class must be selected",
    path: ["uppercase"],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customSymbols: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIMILAR_CHARS = /[0O1lI]/g;
const AMBIGUOUS_CHARS = /[{}[\]()/\\'"`,.;<>]/g;

function buildOpts(values: FormValues): PasswordOptions {
  let customSymbols = values.customSymbols;
  if (values.excludeSimilar) customSymbols = customSymbols.replace(SIMILAR_CHARS, "");
  if (values.excludeAmbiguous) customSymbols = customSymbols.replace(AMBIGUOUS_CHARS, "");
  return {
    length: values.length,
    uppercase: values.uppercase,
    lowercase: values.lowercase,
    digits: values.digits,
    symbols: values.symbols,
    customSymbols: customSymbols || undefined,
  };
}

function generate(values: FormValues): string {
  try {
    return generatePassword(buildOpts(values));
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PasswordGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { register, control, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const values = useWatch({ control }) as FormValues;
  const [output, setOutput] = React.useState<string>(() => generate(DEFAULTS));

  React.useEffect(() => {
    const safe: FormValues = { ...DEFAULTS, ...values };
    if (!safe.uppercase && !safe.lowercase && !safe.digits && !safe.symbols) return;
    setOutput(generate(safe));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.length,
    values.uppercase,
    values.lowercase,
    values.digits,
    values.symbols,
    values.excludeSimilar,
    values.excludeAmbiguous,
    values.customSymbols,
  ]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate({ ...DEFAULTS, ...values }));
  }, [values]);

  const opts = buildOpts({ ...DEFAULTS, ...values });
  const charsetSize = charsetSizeForPassword(opts);
  const entropyBits = estimateBits(charsetSize, opts.length);

  const lengthValue = watch("length");
  const symbolsChecked = watch("symbols");

  return (
    <ToolLayout
      toolId="password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["passphrase", "pin", "api-key", "master-password"]}
      securityNotes="Passwords are generated in your browser using the Web Cryptography API and never transmitted anywhere."
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
          filename="password"
        >
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()} aria-label="Password options">

            {/* Length slider */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="pw-length" className="text-sm font-medium text-foreground">
                  Length
                </label>
                <span
                  className="tabular-nums text-sm font-semibold text-foreground min-w-[2ch] text-right"
                  aria-live="polite"
                  aria-label={`Current length: ${lengthValue}`}
                >
                  {lengthValue}
                </span>
              </div>
              <Slider
                id="pw-length"
                value={lengthValue}
                onChange={(v) => setValue("length", v)}
                min={8}
                max={128}
                aria-label="Password length"
                aria-valuetext={`${lengthValue} characters`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>8</span>
                <span>128</span>
              </div>
            </div>

            {/* Character sets */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">
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
                ).map(({ name, label }) => {
                  const checked = watch(name);
                  return (
                    <CheckboxTile
                      key={name}
                      checked={checked}
                      onCheckedChange={(v) => setValue(name, v)}
                      label={label}
                    />
                  );
                })}
              </div>
            </fieldset>

            {/* Exclusions */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">
                Exclusions
              </legend>
              <div className="space-y-3">
                <Checkbox
                  checked={watch("excludeSimilar")}
                  onCheckedChange={(v) => setValue("excludeSimilar", v)}
                  label="Exclude similar characters"
                  description={<span className="font-mono">0, O, 1, l, I</span>}
                />
                <Checkbox
                  checked={watch("excludeAmbiguous")}
                  onCheckedChange={(v) => setValue("excludeAmbiguous", v)}
                  label="Exclude ambiguous characters"
                  description={<span className="font-mono">{"{}[]()/'\"`;.,<>"}</span>}
                />
              </div>
            </fieldset>

            {/* Custom symbols */}
            {symbolsChecked && (
              <div>
                <label
                  htmlFor="pw-custom-symbols"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Custom symbols{" "}
                  <span className="font-normal text-muted-foreground">(overrides default set)</span>
                </label>
                <input
                  id="pw-custom-symbols"
                  type="text"
                  maxLength={50}
                  placeholder="e.g. !@#$"
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  {...register("customSymbols")}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {charsetSize} character pool &mdash; {Math.round(entropyBits)} bits of entropy
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
