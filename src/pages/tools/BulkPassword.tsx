/**
 * Bulk Password Generator
 *
 * Generates multiple passwords at once.
 * - For count ≤ 10: generates on the main thread (fast enough).
 * - For count > 10: offloads to the crypto Web Worker with progress tracking.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Slider } from "@/components/ui/Slider";
import { CheckboxTile } from "@/components/ui/Checkbox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { generatePassword } from "@/utils/password";
import { useWorker } from "@/hooks/useWorker";
import type { WorkerResponse, PasswordOpts } from "@/workers/crypto.worker";
import type { FAQItem } from "@/components/FAQSection";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "When do I need bulk password generation?",
    answer:
      "Bulk generation is useful when provisioning multiple user accounts, resetting credentials for a team, generating one-time passwords for distribution, or seeding test databases with unique passwords. Each password is independently generated with its own cryptographic randomness.",
  },
  {
    question: "Are all passwords unique?",
    answer:
      "Yes. Each password is generated independently using window.crypto.getRandomValues, giving each its own entropy. With a 16-character password using all character sets, the probability of any two matching is astronomically small — effectively zero for any practical batch size.",
  },
  {
    question: "How should I distribute these passwords securely?",
    answer:
      "Export the file, then share each password through a secure channel (encrypted email, a secrets manager, or a one-time link service). Never send passwords in plain text via SMS or standard email. Consider using a password manager that supports bulk import.",
  },
  {
    question: "Can I import these into a password manager?",
    answer:
      "Most password managers support CSV or plain-text import. Export as .txt with one password per line, then pair each with the appropriate username and URL in your manager's import tool. Check your manager's documentation for the exact format required.",
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNT_OPTIONS = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
] as const;

type Count = 5 | 10 | 20 | 50;

/** Threshold above which generation is delegated to the worker. */
const WORKER_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Main thread generation (small batches)
// ---------------------------------------------------------------------------

function generateBulkMainThread(
  count: Count,
  length: number,
  opts: { uppercase: boolean; lowercase: boolean; digits: boolean; symbols: boolean },
): string[] {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      results.push(generatePassword({ length, ...opts }));
    } catch {
      results.push("");
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  // Options
  const [count, setCount] = React.useState<Count>(10);
  const [length, setLength] = React.useState(16);
  const [uppercase, setUppercase] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(true);
  const [digits, setDigits] = React.useState(true);
  const [symbols, setSymbols] = React.useState(true);

  // Output
  const [output, setOutput] = React.useState<string[]>(() =>
    generateBulkMainThread(10, 16, { uppercase: true, lowercase: true, digits: true, symbols: true }),
  );
  const [isWorkerGenerating, setIsWorkerGenerating] = React.useState(false);
  const [workerProgress, setWorkerProgress] = React.useState(0);

  const taskIdRef = React.useRef<string>("");

  // ---------------------------------------------------------------------------
  // Worker setup
  // ---------------------------------------------------------------------------

  const handleMessage = React.useCallback((msg: WorkerResponse) => {
    if (msg.id !== taskIdRef.current) return;

    switch (msg.type) {
      case "PROGRESS":
        setWorkerProgress(msg.percent);
        break;
      case "BULK_RESULT":
        setOutput(msg.passwords);
        setIsWorkerGenerating(false);
        setWorkerProgress(100);
        break;
      case "ERROR":
        setIsWorkerGenerating(false);
        break;
      default:
        break;
    }
  }, []);

  const { send, ready } = useWorker({ onMessage: handleMessage });

  // ---------------------------------------------------------------------------
  // Generation logic
  // ---------------------------------------------------------------------------

  const anyEnabled = uppercase || lowercase || digits || symbols;

  const generateViaWorker = React.useCallback(
    (
      currentCount: Count,
      currentLength: number,
      opts: PasswordOpts,
    ) => {
      if (!ready) return;
      const id = `bulk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      taskIdRef.current = id;
      setIsWorkerGenerating(true);
      setWorkerProgress(0);
      send({
        type: "BULK_PASSWORD",
        id,
        count: currentCount,
        opts: { ...opts, length: currentLength },
      });
    },
    [ready, send],
  );

  const doGenerate = React.useCallback(
    (
      currentCount: Count,
      currentLength: number,
      currentUppercase: boolean,
      currentLowercase: boolean,
      currentDigits: boolean,
      currentSymbols: boolean,
    ) => {
      if (!anyEnabled) return;
      const opts: PasswordOpts = {
        length: currentLength,
        uppercase: currentUppercase,
        lowercase: currentLowercase,
        digits: currentDigits,
        symbols: currentSymbols,
      };

      if (currentCount > WORKER_THRESHOLD) {
        generateViaWorker(currentCount, currentLength, opts);
      } else {
        setOutput(
          generateBulkMainThread(currentCount, currentLength, {
            uppercase: currentUppercase,
            lowercase: currentLowercase,
            digits: currentDigits,
            symbols: currentSymbols,
          }),
        );
      }
    },
    [anyEnabled, generateViaWorker],
  );

  // Re-generate whenever options change
  React.useEffect(() => {
    doGenerate(count, length, uppercase, lowercase, digits, symbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, length, uppercase, lowercase, digits, symbols]);

  const handleRegenerate = React.useCallback(() => {
    doGenerate(count, length, uppercase, lowercase, digits, symbols);
  }, [count, length, uppercase, lowercase, digits, symbols, doGenerate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ToolLayout
      toolId="bulk-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "pin"]}
      securityNotes="Each password is generated independently with cryptographic randomness. Export and store them securely. Never transmit passwords in plaintext."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          isGenerating={isWorkerGenerating}
          multiline
          filename="bulk-passwords"
          exportFormats={["txt", "json"]}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of passwords to generate"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="bulk-length" className="text-sm font-medium text-foreground">
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
                id="bulk-length"
                value={length}
                onChange={setLength}
                min={8}
                max={64}
                aria-label="Password length"
                aria-valuetext={`${length} characters`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-foreground">Character sets</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <CheckboxTile checked={uppercase} onCheckedChange={setUppercase} label="Uppercase" />
                <CheckboxTile checked={lowercase} onCheckedChange={setLowercase} label="Lowercase" />
                <CheckboxTile checked={digits} onCheckedChange={setDigits} label="Digits" />
                <CheckboxTile checked={symbols} onCheckedChange={setSymbols} label="Symbols" />
              </div>
            </fieldset>

            {/* Progress bar for worker-mode generation */}
            {isWorkerGenerating && count > WORKER_THRESHOLD && (
              <div
                className="space-y-2"
                aria-live="polite"
                aria-label="Generating passwords"
              >
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={workerProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Bulk generation progress"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${workerProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Generating {count} passwords… {workerProgress}%
                </p>
              </div>
            )}
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
