import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Hash, AlertTriangle } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/button";
import { sha256, sha512, sha1 } from "@/utils/hashing";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is a cryptographic hash?",
    answer:
      "A hash function takes input of any size and produces a fixed-size output (digest) that is deterministic (same input always gives same output), one-way (you cannot reverse a hash to get the input), and collision-resistant (it's computationally infeasible to find two different inputs with the same hash). Hashes are used for file integrity verification, password storage, digital signatures, and data deduplication.",
  },
  {
    question: "SHA-256 vs SHA-512 — which should I use?",
    answer:
      "SHA-256 produces a 32-byte (256-bit) output and is suitable for most applications. SHA-512 produces a 64-byte (512-bit) output, which is larger but not necessarily more secure for most use cases. SHA-512 can be faster than SHA-256 on 64-bit hardware. Use SHA-256 by default unless you have specific requirements for a larger digest.",
  },
  {
    question: "Why is SHA-1 deprecated?",
    answer:
      "SHA-1 was broken in 2017 when Google demonstrated a practical collision attack (SHAttered). Two different PDF files with the same SHA-1 hash were produced. SHA-1 should no longer be used for security purposes. It remains available here only for computing checksums of legacy systems that still require it.",
  },
  {
    question: "Is my input data sent anywhere?",
    answer:
      "No. All hashing is performed locally in your browser using the SubtleCrypto API. Your input text never leaves the page. There are no network requests, no logging, and no storage. Close the browser tab to discard everything.",
  },
];

type Algorithm = "SHA-256" | "SHA-512" | "SHA-1";

const ALGORITHM_OPTIONS = [
  { value: "SHA-256" as Algorithm, label: "SHA-256" },
  { value: "SHA-512" as Algorithm, label: "SHA-512" },
  { value: "SHA-1" as Algorithm, label: "SHA-1 (legacy)" },
] as const;

async function hashInput(text: string, algorithm: Algorithm): Promise<string> {
  switch (algorithm) {
    case "SHA-256": return sha256(text);
    case "SHA-512": return sha512(text);
    case "SHA-1": return sha1(text);
  }
}

export default function HashGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [input, setInput] = React.useState("");
  const [algorithm, setAlgorithm] = React.useState<Algorithm>("SHA-256");
  const [output, setOutput] = React.useState("");
  const [isHashing, setIsHashing] = React.useState(false);

  const handleHash = React.useCallback(async () => {
    if (!input.trim()) return;
    setIsHashing(true);
    try {
      const result = await hashInput(input, algorithm);
      setOutput(result);
    } finally {
      setIsHashing(false);
    }
  }, [input, algorithm]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      void handleHash();
    }
  }, [handleHash]);

  return (
    <ToolLayout
      toolId="hash-generator"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["hmac-key", "salt-generator", "encryption-key"]}
      securityNotes="Your input is never sent to any server. All hashing is performed locally using the SubtleCrypto API. Input is discarded when you leave the page."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Input card */}
        <section
          aria-label="Hash generator"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          {/* Algorithm selector */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Algorithm</p>
            <SegmentedControl
              options={ALGORITHM_OPTIONS}
              value={algorithm}
              onChange={(v) => { setAlgorithm(v); setOutput(""); }}
              aria-label="Hash algorithm"
            />
            {algorithm === "SHA-1" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>SHA-1 is cryptographically broken. Use only for legacy compatibility.</span>
              </div>
            )}
          </div>

          {/* Input textarea */}
          <div>
            <label htmlFor="hash-input" className="mb-1.5 block text-sm font-medium text-foreground">
              Input text
            </label>
            <textarea
              id="hash-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter text to hash…"
              rows={4}
              aria-describedby="hash-output-region"
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground font-mono",
                "resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Press <kbd className="rounded border px-1 font-mono text-xs">⌘Enter</kbd> to hash
            </p>
          </div>

          {/* Hash button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => void handleHash()}
              disabled={!input.trim() || isHashing}
              className="gap-2"
            >
              <Hash className="h-4 w-4" aria-hidden="true" />
              {isHashing ? "Hashing…" : "Hash input"}
            </Button>
            {input && (
              <button
                type="button"
                onClick={() => { setInput(""); setOutput(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Output */}
          <div
            id="hash-output-region"
            aria-live="polite"
            aria-atomic="true"
          >
            {output ? (
              <div className="space-y-3">
                <OutputBlock
                  value={output}
                  label={`${algorithm} Hash`}
                  aria-label={`${algorithm} hash output`}
                />
                <CopyButton value={output} size="sm" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hash output will appear here after clicking &ldquo;Hash input&rdquo;.
              </p>
            )}
          </div>
        </section>
      </motion.div>
    </ToolLayout>
  );
}
