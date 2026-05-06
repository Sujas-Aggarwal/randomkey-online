import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { EntropyMeter } from "@/components/ui/EntropyMeter";
import { estimateBits, entropyLabel } from "@/utils/entropy";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How is password strength calculated?",
    answer:
      "Strength is estimated by detecting which character sets are present (uppercase, lowercase, digits, symbols) to determine the pool size, then computing log2(poolSize^length) to get entropy in bits. This is a theoretical upper bound — actual strength depends on whether the password was randomly generated. A password like 'aaaaaaaaaaaaaaa' has a large pool but nearly zero entropy because it's predictable.",
  },
  {
    question: "What are the limitations of a browser strength checker?",
    answer:
      "Browser-based checkers cannot detect dictionary words, common patterns, keyboard walks (qwerty123), or pwned passwords from breach databases. They estimate theoretical entropy from character variety and length. A password like 'Password1!' scores moderately despite being extremely common. Always use randomly generated passwords instead of human-chosen ones.",
  },
  {
    question: "Is my password sent anywhere?",
    answer:
      "Absolutely not. Your password never leaves your browser. This tool does all analysis locally using JavaScript. There is no network request, no logging, and no storage. The analysis happens entirely in memory and is discarded when you close the page.",
  },
  {
    question: "What entropy is considered secure?",
    answer:
      "NIST SP 800-63 recommends at least 80 bits for general use. Most security researchers consider 60 bits sufficient for online attacks (due to rate limiting), 80+ bits for offline attacks on modern hardware, and 120+ bits for long-term or high-value security. This tool labels 120+ bits as 'Very Strong'.",
  },
];

interface Analysis {
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  poolSize: number;
  entropyBits: number;
  warnings: string[];
}

function analyzePassword(password: string): Analysis {
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  let poolSize = 0;
  if (hasUppercase) poolSize += 26;
  if (hasLowercase) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 32;
  if (poolSize === 0) poolSize = 1;

  const entropyBits = estimateBits(poolSize, length);

  const warnings: string[] = [];
  if (length < 8) warnings.push("Password is too short (minimum 8 characters recommended).");
  if (length < 12) warnings.push("Consider using at least 12 characters for better security.");
  if (!hasUppercase || !hasLowercase) warnings.push("Mix uppercase and lowercase letters for a larger character pool.");
  if (!hasDigits) warnings.push("Adding digits increases the character pool.");
  if (!hasSymbols) warnings.push("Adding symbols provides the strongest character pool.");

  // Keyboard walk detection
  const WALKS = ["qwerty", "asdfgh", "zxcvbn", "123456", "654321", "abcdef"];
  const lower = password.toLowerCase();
  for (const walk of WALKS) {
    if (lower.includes(walk)) {
      warnings.push("Keyboard walk pattern detected — this makes the password easier to guess.");
      break;
    }
  }

  // Repeated character detection
  if (/(.)\1{3,}/.test(password)) {
    warnings.push("Repeated characters detected — avoid using the same character multiple times in a row.");
  }

  return { length, hasUppercase, hasLowercase, hasDigits, hasSymbols, poolSize, entropyBits, warnings };
}

const CHARSET_LABELS = [
  { key: "hasUppercase" as const, label: "Uppercase (A–Z)" },
  { key: "hasLowercase" as const, label: "Lowercase (a–z)" },
  { key: "hasDigits" as const, label: "Digits (0–9)" },
  { key: "hasSymbols" as const, label: "Symbols (!@#…)" },
];

export default function PasswordStrengthPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const analysis = password ? analyzePassword(password) : null;
  const label = analysis ? entropyLabel(analysis.entropyBits) : null;

  return (
    <ToolLayout
      toolId="password-strength"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "master-password"]}
      securityNotes="Your password never leaves your browser. All analysis is performed locally in JavaScript with no network requests."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Input card */}
        <section
          aria-label="Password strength checker"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          <div>
            <label htmlFor="pw-input" className="mb-2 block text-sm font-medium text-foreground">
              Enter a password to analyze
            </label>
            <div className="relative">
              <input
                id="pw-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Paste or type a password…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 pr-10",
                  "text-sm text-foreground font-mono placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                )}
                aria-describedby="pw-strength-status"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Results */}
          <div
            id="pw-strength-status"
            aria-live="polite"
            aria-atomic="true"
          >
            {analysis ? (
              <div className="space-y-4">
                {/* Entropy meter */}
                <EntropyMeter bits={analysis.entropyBits} showLabel showBits />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-foreground">{analysis.length}</p>
                    <p className="text-xs text-muted-foreground">Length</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-foreground">{analysis.poolSize}</p>
                    <p className="text-xs text-muted-foreground">Pool size</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-foreground">{Math.round(analysis.entropyBits)}</p>
                    <p className="text-xs text-muted-foreground">Entropy bits</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-center">
                    <p className={cn(
                      "text-sm font-bold text-foreground",
                      label === "very-weak" && "text-red-500",
                      label === "weak" && "text-orange-500",
                      label === "fair" && "text-yellow-600 dark:text-yellow-400",
                      (label === "strong" || label === "very-strong") && "text-green-600 dark:text-green-400"
                    )}>
                      {label === "very-weak" ? "Very Weak" : label === "weak" ? "Weak" : label === "fair" ? "Fair" : label === "strong" ? "Strong" : "Very Strong"}
                    </p>
                    <p className="text-xs text-muted-foreground">Strength</p>
                  </div>
                </div>

                {/* Character sets detected */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Character sets detected</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CHARSET_LABELS.map(({ key, label: charLabel }) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {analysis[key] ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" aria-hidden="true" />
                        )}
                        <span className={analysis[key] ? "text-foreground" : "text-muted-foreground"}>{charLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    {analysis.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a password above to see its strength analysis.
              </p>
            )}
          </div>
        </section>
      </motion.div>
    </ToolLayout>
  );
}
