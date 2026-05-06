import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generateAPIKey } from "@/utils/apikey";
import type { FAQItem } from "@/components/FAQSection";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How long should an API key be?",
    answer:
      "API keys should contain at least 128 bits (16 bytes) of randomness, though 256 bits (32 bytes) is the modern standard. Short keys are vulnerable to brute-force attacks, especially if the attacker can enumerate valid keys from API responses. The encoded length will be longer than the raw byte length — for example, 32 bytes encodes to 43 characters in base64url or 64 characters in hex.",
  },
  {
    question: "What format should I use for API keys?",
    answer:
      "Base64url is the most common format: it is URL-safe, compact, and widely supported in HTTP headers and query strings. Hex is human-readable and safe everywhere but produces twice as many characters. Some companies (like Stripe with 'sk-' or GitHub with 'ghp_') add a vendor prefix so keys are identifiable and can be auto-detected by secret scanners to prevent accidental leakage in code repositories.",
  },
  {
    question: "What's the difference between hex and base64?",
    answer:
      "Both are encodings of the same random bytes. Hex uses characters 0-9 and a-f, resulting in 2 characters per byte. Base64 uses A-Z, a-z, 0-9, +, and /, resulting in approximately 1.33 characters per byte. Base64url replaces + with - and / with _ for URL safety. Given the same number of random bytes, both have identical security; base64url is just more compact.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ENTROPY_BYTES = [16, 24, 32, 64] as const;
type EntropyBytes = (typeof ENTROPY_BYTES)[number];

const schema = z.object({
  prefix: z.string().max(20),
  entropyBytes: z.coerce.number().refine((v): v is EntropyBytes =>
    ENTROPY_BYTES.includes(v as EntropyBytes)
  ),
  encoding: z.enum(["hex", "base64url", "base64"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  prefix: "",
  entropyBytes: 32,
  encoding: "base64url",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generate(values: FormValues): string {
  try {
    return generateAPIKey({
      prefix: values.prefix,
      length: values.entropyBytes,
      encoding: values.encoding,
    });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { register, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const entropyBytes = watch("entropyBytes");
  const encoding = watch("encoding");
  const prefix = watch("prefix");

  const [output, setOutput] = React.useState<string>(() => generate(DEFAULTS));

  React.useEffect(() => {
    setOutput(generate({ prefix, entropyBytes, encoding }));
  }, [prefix, entropyBytes, encoding]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate({ prefix, entropyBytes, encoding }));
  }, [prefix, entropyBytes, encoding]);

  const entropyBits = (entropyBytes ?? 32) * 8;

  return (
    <ToolLayout
      toolId="api-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["jwt-secret", "hmac-key", "random-string"]}
      securityNotes={`API keys are generated using ${entropyBits} bits of cryptographically secure random data via the Web Cryptography API. Keys are never transmitted or stored.`}
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
          filename="api-key"
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="API key options"
          >
            {/* Prefix */}
            <div>
              <label
                htmlFor="ak-prefix"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Prefix{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="ak-prefix"
                type="text"
                maxLength={20}
                placeholder='e.g. sk-  or  pk_live_'
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2",
                  "font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
                {...register("prefix")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Prefixes help identify your keys and enable automatic secret scanning.
              </p>
            </div>

            {/* Entropy bytes (bit strength) */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Key strength
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Key strength">
                {ENTROPY_BYTES.map((bytes) => (
                  <button
                    key={bytes}
                    type="button"
                    role="radio"
                    aria-checked={entropyBytes === bytes}
                    onClick={() => setValue("entropyBytes", bytes)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      entropyBytes === bytes
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {bytes * 8}-bit
                    <span className="ml-1.5 text-xs opacity-70">({bytes}B)</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Encoding */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Encoding
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Output encoding">
                {(
                  [
                    { value: "hex", label: "Hex" },
                    { value: "base64url", label: "Base64url" },
                    { value: "base64", label: "Base64" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={encoding === opt.value}
                    onClick={() => setValue("encoding", opt.value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      encoding === opt.value
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
              {entropyBits} bits of entropy
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
