import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { getRandomBytes } from "@/utils/random";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is TOTP?",
    answer:
      "TOTP (Time-based One-Time Password) is an algorithm defined in RFC 6238 that generates temporary 6-digit codes synchronized with a clock. It's the standard behind Google Authenticator, Authy, and similar apps. A shared secret key is stored in both the server and the authenticator app — at each 30-second interval, both compute the same code using HMAC-SHA1.",
  },
  {
    question: "How do I use this secret in my application?",
    answer:
      "Store the base32 secret on your server associated with the user's account. Display the otpauth:// URI (or a QR code of it) to the user for one-time enrollment in their authenticator app. During login, generate the expected TOTP code server-side and compare it to what the user enters. Libraries like `speakeasy` (Node.js) or `pyotp` (Python) handle this.",
  },
  {
    question: "TOTP vs SMS 2FA — which is better?",
    answer:
      "TOTP is significantly more secure than SMS 2FA. SMS is vulnerable to SIM-swapping attacks, where an attacker convinces a carrier to transfer your phone number. TOTP codes are generated locally and never transmitted over the phone network. Use TOTP (or a hardware key like YubiKey) whenever possible.",
  },
  {
    question: "Which authenticator apps are compatible?",
    answer:
      "Any RFC 6238-compliant app works: Google Authenticator, Authy, Microsoft Authenticator, 1Password, Bitwarden, and hardware tokens like YubiKey with TOTP support. The otpauth:// URI format is a widely accepted standard for enrollment across all these apps.",
  },
];

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(bytes: Uint8Array): string {
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      const index = (buffer >> bitsLeft) & 0x1f;
      result += BASE32_ALPHABET[index];
    }
  }

  if (bitsLeft > 0) {
    const index = (buffer << (5 - bitsLeft)) & 0x1f;
    result += BASE32_ALPHABET[index];
  }

  return result;
}

function generateTOTPSecret(): string {
  // 20 bytes = 160 bits
  const bytes = getRandomBytes(20);
  return toBase32(bytes);
}

type Algorithm = "SHA1" | "SHA256" | "SHA512";
type Digits = 6 | 8;
type Period = 30 | 60;

const ALGORITHM_OPTIONS = [
  { value: "SHA1" as Algorithm, label: "SHA-1" },
  { value: "SHA256" as Algorithm, label: "SHA-256" },
  { value: "SHA512" as Algorithm, label: "SHA-512" },
] as const;

const DIGITS_OPTIONS = [
  { value: 6 as Digits, label: "6 digits" },
  { value: 8 as Digits, label: "8 digits" },
] as const;

const PERIOD_OPTIONS = [
  { value: 30 as Period, label: "30s" },
  { value: 60 as Period, label: "60s" },
] as const;

export default function TotpSecretPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [account, setAccount] = React.useState("user@example.com");
  const [issuer, setIssuer] = React.useState("MyApp");
  const [algorithm, setAlgorithm] = React.useState<Algorithm>("SHA1");
  const [digits, setDigits] = React.useState<Digits>(6);
  const [period, setPeriod] = React.useState<Period>(30);
  const [secret, setSecret] = React.useState<string>(() => generateTOTPSecret());

  const accountEnc = encodeURIComponent(account || "user");
  const issuerEnc = encodeURIComponent(issuer || "MyApp");
  const uri = `otpauth://totp/${issuerEnc}:${accountEnc}?secret=${secret}&issuer=${issuerEnc}&algorithm=${algorithm}&digits=${digits}&period=${period}`;

  const handleRegenerate = React.useCallback(() => {
    setSecret(generateTOTPSecret());
  }, []);

  return (
    <ToolLayout
      toolId="totp-2fa"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["backup-codes", "api-key", "jwt-secret"]}
      securityNotes="Keep this secret secure — anyone with it can generate valid TOTP codes for your application. Store it encrypted and never expose it in client-side code or logs."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={secret}
          onRegenerate={handleRegenerate}
          outputLabel="TOTP Secret (Base32)"
          filename="totp-secret"
          exportFormats={["txt"]}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="totp-account" className="mb-1.5 block text-sm font-medium text-foreground">
                  Account name
                </label>
                <input
                  id="totp-account"
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
              </div>
              <div>
                <label htmlFor="totp-issuer" className="mb-1.5 block text-sm font-medium text-foreground">
                  Issuer
                </label>
                <input
                  id="totp-issuer"
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="MyApp"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Algorithm</p>
                <SegmentedControl
                  options={ALGORITHM_OPTIONS}
                  value={algorithm}
                  onChange={(v) => setAlgorithm(v)}
                  aria-label="TOTP algorithm"
                  size="sm"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Digits</p>
                <SegmentedControl
                  options={DIGITS_OPTIONS}
                  value={digits}
                  onChange={(v) => setDigits(v)}
                  aria-label="TOTP digits"
                  size="sm"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Period</p>
                <SegmentedControl
                  options={PERIOD_OPTIONS}
                  value={period}
                  onChange={(v) => setPeriod(v)}
                  aria-label="TOTP period"
                  size="sm"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">OTPAuth URI</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Use a QR code tool to generate a scannable code from this URI.
              </p>
              <OutputBlock value={uri} label="otpauth:// URI" aria-label="OTPAuth URI" />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
