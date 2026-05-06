import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { QrCode } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { generatePassword } from "@/utils/password";
import { getRandomBytes } from "@/utils/random";
import { toHex } from "@/utils/encoding";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";
import { Slider } from "@/components/ui/Slider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How long should a WiFi password be?",
    answer:
      "WPA2 and WPA3 accept passwords from 8 to 63 characters. Use at least 12–16 characters for home networks, and 20+ for office or high-security environments. A 20-character alphanumeric password has over 100 bits of entropy — far more than an attacker can crack even with dedicated hardware. Shorter passwords are vulnerable to offline attacks against captured WPA handshakes.",
  },
  {
    question: "WPA2 vs WPA3 — does it matter for the password?",
    answer:
      "The password strength requirements are the same (8–63 characters), but WPA3 uses a more secure handshake protocol (SAE/Dragonfly) that protects against offline dictionary attacks even for weaker passwords. With WPA2, captured handshakes can be brute-forced offline. With WPA3, each guess requires active interaction with the access point. If your router supports WPA3, enable it — but still use a strong password.",
  },
  {
    question: "How do I share my WiFi password securely?",
    answer:
      "iOS and Android both support WiFi sharing via QR code — no app required. On iOS: go to WiFi settings, tap your network, and choose 'Share Password'. On Android: tap the QR code icon next to your network name. For guests, consider creating a guest network with a separate password. Avoid texting or emailing passwords in plain text — use a QR code or a secure messaging app with end-to-end encryption.",
  },
  {
    question: "What is a WEP password?",
    answer:
      "WEP (Wired Equivalent Privacy) is a legacy WiFi security protocol from 1997 that has been broken since 2001. A WEP password is 10 hex digits (64-bit) or 26 hex digits (128-bit), but the protocol itself is fundamentally insecure and can be cracked in minutes. Do not use WEP if your router supports WPA2 or WPA3. WEP is only included here for legacy hardware compatibility.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WPACharset = "memorable" | "full";
type WEPBits = "64" | "128";
type ProtocolType = "wpa" | "wep";

// ---------------------------------------------------------------------------
// Schema — flat form to avoid discriminated union complexity
// ---------------------------------------------------------------------------

// We use a single flat form and handle type switching manually
const schema = z.object({
  protocol: z.enum(["wpa", "wep"]),
  wpaLength: z.number().int().min(8).max(63),
  wpaCharset: z.enum(["memorable", "full"]),
  wepBits: z.enum(["64", "128"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  protocol: "wpa",
  wpaLength: 20,
  wpaCharset: "memorable",
  wepBits: "64",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generate(values: FormValues): string {
  try {
    if (values.protocol === "wep") {
      const byteCount = values.wepBits === "64" ? 5 : 13;
      return toHex(getRandomBytes(byteCount));
    }
    return generatePassword({
      length: values.wpaLength,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: values.wpaCharset === "full",
    });
  } catch {
    return "";
  }
}

function calcEntropyBits(values: FormValues): number {
  if (values.protocol === "wep") {
    return parseInt(values.wepBits, 10);
  }
  const charsetSize = values.wpaCharset === "memorable" ? 62 : 90;
  return estimateBits(charsetSize, values.wpaLength);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WifiPasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const { setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const protocol = watch("protocol") as ProtocolType;
  const wpaLength = watch("wpaLength");
  const wpaCharset = watch("wpaCharset") as WPACharset;
  const wepBits = watch("wepBits") as WEPBits;

  const formValues = React.useMemo<FormValues>(
    () => ({ protocol, wpaLength, wpaCharset, wepBits }),
    [protocol, wpaLength, wpaCharset, wepBits]
  );

  const [output, setOutput] = React.useState<string>(() => generate(DEFAULTS));

  React.useEffect(() => {
    setOutput(generate(formValues));
  }, [formValues]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generate(formValues));
  }, [formValues]);

  const entropyBits = calcEntropyBits(formValues);

  const WPA_CHARSETS: readonly { value: WPACharset; label: string }[] = [
    { value: "memorable", label: "Memorable (alphanumeric)" },
    { value: "full", label: "Full (with symbols)" },
  ];

  const WEP_SIZES: readonly { value: WEPBits; label: string }[] = [
    { value: "64", label: "64-bit (10 hex chars)" },
    { value: "128", label: "128-bit (26 hex chars)" },
  ];

  return (
    <ToolLayout
      toolId="wifi-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "pin"]}
      securityNotes="WiFi passwords are generated locally using the Web Cryptography API and never transmitted to any server."
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
          filename="wifi-password"
        >
          <form
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
            aria-label="WiFi password options"
          >
            {/* Protocol type */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Protocol
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="WiFi security protocol">
                {(
                  [
                    { value: "wpa" as const, label: "WPA2 / WPA3", badge: "recommended" },
                    { value: "wep" as const, label: "WEP", badge: "legacy" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={protocol === opt.value}
                    onClick={() => setValue("protocol", opt.value)}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      protocol === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {opt.label}
                    <span className="ml-1.5 text-xs opacity-70">({opt.badge})</span>
                  </button>
                ))}
              </div>
              {protocol === "wep" && (
                <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                  WEP is broken and should not be used. Use WPA2/WPA3 if your hardware supports it.
                </p>
              )}
            </fieldset>

            {/* WPA options */}
            {protocol === "wpa" && (
              <>
                {/* Length slider */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="wifi-length"
                      className="text-sm font-medium text-foreground"
                    >
                      Length
                    </label>
                    <span
                      className="tabular-nums text-sm font-semibold text-foreground"
                      aria-live="polite"
                    >
                      {wpaLength}
                    </span>
                  </div>
                  <Slider
                    id="wifi-length"
                    value={wpaLength ?? 20}
                    onChange={(v) => setValue("wpaLength", v)}
                    min={8}
                    max={63}
                    aria-label="WiFi password length"
                    aria-valuetext={`${wpaLength} characters`}
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground select-none">
                    <span>8 (min)</span>
                    <span>63 (max)</span>
                  </div>
                </div>

                {/* Charset */}
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">
                    Character set
                  </legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Character set">
                    {WPA_CHARSETS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={wpaCharset === opt.value}
                        onClick={() => setValue("wpaCharset", opt.value)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                          wpaCharset === opt.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-accent"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {/* WEP options */}
            {protocol === "wep" && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">
                  WEP key size
                </legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="WEP key size">
                  {WEP_SIZES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={wepBits === opt.value}
                      onClick={() => setValue("wepBits", opt.value)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        wepBits === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* QR code note */}
            <div
              className={cn(
                "flex items-start gap-3 rounded-md border px-4 py-3",
                "text-sm text-muted-foreground"
              )}
            >
              <QrCode className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                QR code sharing is coming in a future update. Use your router&apos;s
                app or iOS/Android built-in sharing to generate a WiFi QR code.
              </span>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              {Math.round(entropyBits)} bits of entropy
            </p>
          </form>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
