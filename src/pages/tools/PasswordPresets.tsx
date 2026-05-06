import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/button";
import { generatePassword, generatePIN } from "@/utils/password";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are password presets for?",
    answer:
      "Presets are curated configurations optimized for common use cases. Instead of manually adjusting settings each time, you can pick a preset that matches your security requirements. Each preset is a best-practice recommendation — you can always adjust settings in the full password generator.",
  },
  {
    question: "Which preset should I use for my account?",
    answer:
      "For most online accounts, use 'Website Login' (16 chars, all charsets). For password managers or encryption, use 'High Security' (32 chars). For WiFi networks, 'WPA Password' avoids symbols that some routers reject. 'Easy to Type' is useful when entering on a TV remote or game controller.",
  },
  {
    question: "Are preset passwords as secure as custom ones?",
    answer:
      "Yes. Each preset password is generated fresh using window.crypto.getRandomValues with the same cryptographic quality as the main password generator. The preset just sets the parameters — the randomness is identical.",
  },
  {
    question: "Can I regenerate just one preset?",
    answer:
      "Yes — click the refresh icon next to any individual preset to regenerate only that one. Use 'Regenerate All' at the top to refresh every preset at once.",
  },
];

interface Preset {
  id: string;
  name: string;
  description: string;
  generate: () => string;
}

const PRESETS: Preset[] = [
  {
    id: "high-security",
    name: "High Security",
    description: "32 chars, all character sets",
    generate: () => generatePassword({ length: 32, uppercase: true, lowercase: true, digits: true, symbols: true }),
  },
  {
    id: "easy-to-type",
    name: "Easy to Type",
    description: "16 chars, no symbols, no ambiguous",
    generate: () => generatePassword({ length: 16, uppercase: true, lowercase: true, digits: true, symbols: false }),
  },
  {
    id: "wpa-password",
    name: "WPA Password",
    description: "20 chars, alphanumeric",
    generate: () => generatePassword({ length: 20, uppercase: true, lowercase: true, digits: true, symbols: false }),
  },
  {
    id: "pin-code",
    name: "PIN Code",
    description: "6 digits",
    generate: () => generatePIN(6),
  },
  {
    id: "website-login",
    name: "Website Login",
    description: "16 chars, all character sets",
    generate: () => generatePassword({ length: 16, uppercase: true, lowercase: true, digits: true, symbols: true }),
  },
  {
    id: "child-safe",
    name: "Child Safe",
    description: "12 chars, letters only",
    generate: () => generatePassword({ length: 12, uppercase: true, lowercase: true, digits: false, symbols: false }),
  },
];

function usePresetValues(): [Record<string, string>, (id: string) => void, () => void] {
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const preset of PRESETS) {
      initial[preset.id] = preset.generate();
    }
    return initial;
  });

  const regenerateOne = React.useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setValues((prev) => ({ ...prev, [id]: preset.generate() }));
  }, []);

  const regenerateAll = React.useCallback(() => {
    const next: Record<string, string> = {};
    for (const preset of PRESETS) {
      next[preset.id] = preset.generate();
    }
    setValues(next);
  }, []);

  return [values, regenerateOne, regenerateAll];
}

export default function PasswordPresetsPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [values, regenerateOne, regenerateAll] = usePresetValues();

  return (
    <ToolLayout
      toolId="password-presets"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "pin"]}
      securityNotes="All passwords are generated in your browser using the Web Cryptography API. Each preset uses cryptographically secure randomness."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={regenerateAll} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Regenerate All
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const value = values[preset.id] ?? "";
            return (
              <div
                key={preset.id}
                className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => regenerateOne(preset.id)}
                    aria-label={`Regenerate ${preset.name}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <OutputBlock value={value} aria-label={`${preset.name} password`} />
                <CopyButton value={value} size="sm" />
              </div>
            );
          })}
        </div>
      </motion.div>
    </ToolLayout>
  );
}
