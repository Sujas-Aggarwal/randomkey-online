import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generateUUIDv4, generateUUIDv7 } from "@/utils/uuid";
import type { FAQItem } from "@/components/FAQSection";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a UUID?",
    answer:
      "A UUID (Universally Unique Identifier) is a 128-bit identifier formatted as 32 hexadecimal digits in the pattern 8-4-4-4-12 (e.g. 550e8400-e29b-41d4-a716-446655440000). UUIDs are used as database primary keys, correlation IDs, resource identifiers in APIs, and anywhere a unique identifier is needed across distributed systems without a central coordination authority.",
  },
  {
    question: "What's the difference between UUID v4 and v7?",
    answer:
      "UUID v4 is completely random — 122 bits of randomness with no embedded metadata. UUID v7 is time-ordered — the first 48 bits contain a Unix millisecond timestamp, making UUIDs sortable and cluster-friendly in databases. v7 UUIDs improve database index locality because new IDs are always inserted at the end of an index, reducing page splits. Use v4 for pure randomness; use v7 for database primary keys where you want chronological ordering.",
  },
  {
    question: "Are UUIDs unique?",
    answer:
      "Yes, with astronomically high probability. UUID v4 has 122 bits of randomness — to have a 50% chance of a collision, you would need to generate approximately 2.71 quintillion UUIDs (2.71 × 10^18). At 1 billion UUIDs per second, you would need over 85 years to reach that number. In practice, UUID collisions are so unlikely that they are treated as impossible for application purposes.",
  },
  {
    question: "Can two UUIDs collide?",
    answer:
      "Theoretically yes, but the probability is negligibly small for v4. The birthday paradox gives approximately a 50% collision probability after generating 2^61 ≈ 2.3 × 10^18 UUIDs. If your application generates billions of UUIDs per day, the expected time to a collision is still measured in centuries. Real collision risks come from bugs: using Math.random() instead of cryptographic randomness, or seeding a PRNG with a non-random value like a timestamp.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  version: z.enum(["v4", "v7"]),
  count: z.number().int().min(1).max(20),
  format: z.enum(["standard", "no-hyphens", "uppercase"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { version: "v4", count: 1, format: "standard" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUUID(uuid: string, format: FormValues["format"]): string {
  switch (format) {
    case "no-hyphens":
      return uuid.replace(/-/g, "");
    case "uppercase":
      return uuid.toUpperCase();
    default:
      return uuid;
  }
}

function generate(values: FormValues): string[] {
  try {
    const gen = values.version === "v7" ? generateUUIDv7 : generateUUIDv4;
    return Array.from({ length: values.count }, () =>
      formatUUID(gen(), values.format)
    );
  } catch {
    return [""];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UuidGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { register, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const version = watch("version");
  const count = watch("count");
  const format = watch("format");

  const [outputs, setOutputs] = React.useState<string[]>(() => generate(DEFAULTS));

  React.useEffect(() => {
    setOutputs(generate({ version, count, format }));
  }, [version, count, format]);

  const handleRegenerate = React.useCallback(() => {
    setOutputs(generate({ version, count, format }));
  }, [version, count, format]);

  return (
    <ToolLayout
      toolId="uuid"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["api-key", "random-string", "jwt-secret"]}
      securityNotes="UUIDs are generated using crypto.randomUUID() (v4) or a cryptographically secure time-based algorithm (v7). Math.random() is never used."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={outputs}
          onRegenerate={handleRegenerate}
          multiline={count > 1}
          outputLabel={count > 1 ? "UUID" : undefined}
          filename="uuids"
          exportFormats={["txt", "json"]}
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="UUID options"
          >
            {/* Version */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Version
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="UUID version">
                {(["v4", "v7"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={version === v}
                    onClick={() => setValue("version", v)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      version === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    UUID {v}
                    <span className="ml-2 text-xs opacity-70">
                      {v === "v4" ? "(random)" : "(time-ordered)"}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Count */}
            <div>
              <label
                htmlFor="uuid-count"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Count{" "}
                <span className="font-normal text-muted-foreground">(1–20)</span>
              </label>
              <input
                id="uuid-count"
                type="number"
                min={1}
                max={20}
                className={cn(
                  "w-24 rounded-md border bg-background px-3 py-2 text-sm text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
                {...register("count", { valueAsNumber: true })}
              />
            </div>

            {/* Format */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Format
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="UUID format">
                {(
                  [
                    { value: "standard", label: "Standard" },
                    { value: "no-hyphens", label: "No hyphens" },
                    { value: "uppercase", label: "Uppercase" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={format === opt.value}
                    onClick={() => setValue("format", opt.value)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      format === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Format preview */}
              <p className="mt-2 text-xs text-muted-foreground">
                Example:{" "}
                <span className="font-mono">
                  {formatUUID("550e8400-e29b-41d4-a716-446655440000", format)}
                </span>
              </p>
            </fieldset>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              {version === "v4"
                ? "UUID v4: 122 bits of cryptographic randomness."
                : "UUID v7: 48-bit timestamp + 74 bits of cryptographic randomness."}
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
