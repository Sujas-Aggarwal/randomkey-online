import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generateJWTSecret } from "@/utils/apikey";
import type { FAQItem } from "@/components/FAQSection";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a JWT secret?",
    answer:
      "A JWT secret is a symmetric key used to sign JSON Web Tokens using HMAC algorithms (HS256, HS384, HS512). The server signs the token payload with the secret, and verifies incoming tokens by re-signing and comparing. Because it is symmetric, both signing and verification use the same secret — meaning any party with the secret can both create and verify tokens. Never share your JWT secret with clients.",
  },
  {
    question: "How long should a JWT secret be?",
    answer:
      "The JWT specification (RFC 7518) recommends the secret be at least as long as the HMAC output: 256 bits (32 bytes) for HS256, 384 bits for HS384, and 512 bits for HS512. Shorter keys are technically allowed but provide less security. We recommend 256 bits as a minimum and 512 bits for high-security applications. Never use human-memorable strings, UUIDs, or short random values as JWT secrets.",
  },
  {
    question: "HS256 vs RS256 — which should I use?",
    answer:
      "HS256 uses a single shared secret (symmetric) — simpler to implement but requires sharing the secret with every verification endpoint. RS256 uses a private/public key pair (asymmetric) — you sign with the private key and verify with the public key, so verification endpoints never see the private key. For microservices or public APIs where multiple services need to verify tokens, RS256 is strongly preferred. For a single backend service, HS256 with a strong secret is sufficient.",
  },
  {
    question: "Can I rotate JWT secrets?",
    answer:
      "Yes, and you should. Secret rotation is critical security hygiene. When you rotate a JWT secret, existing tokens signed with the old secret become invalid — plan for this in your token validation logic. Common patterns include: supporting two secrets simultaneously during a transition window, using short-lived tokens (so old tokens expire quickly), or implementing a JWKS endpoint with key IDs to support multiple concurrent keys.",
  },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const JWT_STRENGTHS = [256, 384, 512] as const;
type JWTStrength = (typeof JWT_STRENGTHS)[number];

const ALGO_MAP: Record<JWTStrength, string> = {
  256: "HS256",
  384: "HS384",
  512: "HS512",
};

const schema = z.object({
  bits: z.union([z.literal(256), z.literal(384), z.literal(512)]),
  encoding: z.enum(["hex", "base64url"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { bits: 256, encoding: "hex" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generate(values: FormValues): string {
  try {
    return generateJWTSecret({
      bits: values.bits,
      encoding: values.encoding,
    });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JwtSecretPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const bits = watch("bits");
  const encoding = watch("encoding");

  const [output, setOutput] = React.useState<string>(() => generate(DEFAULTS));

  React.useEffect(() => {
    setOutput(generate({ bits, encoding }));
  }, [bits, encoding]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate({ bits, encoding }));
  }, [bits, encoding]);

  const algoHint = ALGO_MAP[bits ?? 256] ?? "HS256";

  return (
    <ToolLayout
      toolId="jwt-secret"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["api-key", "hmac-key", "encryption-key"]}
      securityNotes="JWT secrets are generated using the Web Cryptography API. Never use a short or guessable secret in production. Treat this secret like a password — never commit it to source control."
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
          entropyBits={bits}
          filename="jwt-secret"
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="JWT secret options"
          >
            {/* Strength */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Key strength
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Key strength">
                {JWT_STRENGTHS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    role="radio"
                    aria-checked={bits === b}
                    onClick={() => setValue("bits", b)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      bits === b
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {b}-bit
                    <span className="ml-1.5 text-xs opacity-70">({ALGO_MAP[b]})</span>
                  </button>
                ))}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Recommended for{" "}
                <span className="font-mono font-semibold">{algoHint}</span>
              </p>
            </fieldset>

            {/* Encoding */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Encoding
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Encoding">
                {(
                  [
                    { value: "hex", label: "Hex" },
                    { value: "base64url", label: "Base64url" },
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

            {/* Info panel */}
            <aside
              className={cn(
                "flex gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3",
                "dark:border-blue-900/40 dark:bg-blue-950/30"
              )}
              aria-label="Algorithm information"
            >
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                This generates the signing secret for HMAC-based JWTs (
                <span className="font-mono">HS256</span> /{" "}
                <span className="font-mono">HS384</span> /{" "}
                <span className="font-mono">HS512</span>). For{" "}
                <span className="font-mono">RS256</span> /{" "}
                <span className="font-mono">ES256</span>, use the RSA / EC Key Generator instead.
              </p>
            </aside>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
