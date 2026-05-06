import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CreditCard, Info } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { CopyButton } from "@/components/ui/CopyButton";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are test cards?",
    answer:
      "Test card numbers are officially documented by payment processors for use in sandbox/test environments. They allow developers to simulate payment flows without using real payment instruments. These numbers follow the Luhn algorithm and match specific card network formats, but are configured by processors to trigger specific test outcomes.",
  },
  {
    question: "Why must I use official test cards?",
    answer:
      "Generating random card numbers, even for testing, creates legal and compliance risks. Random PANs might match real cardholder accounts, raising PCI-DSS concerns. Official test cards are explicitly designated for testing, documented by processors, and configured to never process real transactions. Always use these instead of generating fictional numbers.",
  },
  {
    question: "Can I use these in production?",
    answer:
      "No. These numbers only work in sandbox/test mode environments provided by Stripe and Braintree. They will be declined in production. Switch to production API keys and use real payment instruments when you're ready to accept live payments.",
  },
  {
    question: "What about PCI compliance?",
    answer:
      "PCI DSS applies to the handling of real cardholder data. These test numbers are not real PANs and carry no PCI scope concerns in test environments. However, ensure your production systems are PCI compliant — using official test cards helps keep your test flows clearly separate from production.",
  },
];

interface TestCardEntry {
  number: string;
  network: string;
  processor: string;
  description: string;
  cvv: string;
  expiry: string;
}

const TEST_CARDS: TestCardEntry[] = [
  // Stripe
  { number: "4242424242424242", network: "Visa", processor: "Stripe", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "4000056655665556", network: "Visa (debit)", processor: "Stripe", description: "Always succeeds (debit)", cvv: "123", expiry: "12/34" },
  { number: "5555555555554444", network: "Mastercard", processor: "Stripe", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "2223003122003222", network: "Mastercard (2-series)", processor: "Stripe", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "378282246310005", network: "American Express", processor: "Stripe", description: "Always succeeds", cvv: "1234", expiry: "12/34" },
  { number: "6011111111111117", network: "Discover", processor: "Stripe", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "4000000000000002", network: "Visa", processor: "Stripe", description: "Always declined (card_declined)", cvv: "123", expiry: "12/34" },
  { number: "4000000000009995", network: "Visa", processor: "Stripe", description: "Insufficient funds", cvv: "123", expiry: "12/34" },
  { number: "4000002500003155", network: "Visa", processor: "Stripe", description: "Requires 3D Secure", cvv: "123", expiry: "12/34" },
  // Braintree
  { number: "4111111111111111", network: "Visa", processor: "Braintree", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "5431111111111111", network: "Mastercard", processor: "Braintree", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "378282246310005", network: "American Express", processor: "Braintree", description: "Always succeeds", cvv: "1234", expiry: "12/34" },
  { number: "6011111111111117", network: "Discover", processor: "Braintree", description: "Always succeeds", cvv: "123", expiry: "12/34" },
  { number: "4000111111111115", network: "Visa", processor: "Braintree", description: "Processor declined", cvv: "123", expiry: "12/34" },
];

const PROCESSORS = [...new Set(TEST_CARDS.map((c) => c.processor))];

function formatCardNumber(num: string): string {
  // Group into 4s for display
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function TestCardPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [selectedProcessor, setSelectedProcessor] = React.useState<string>("Stripe");

  const filteredCards = TEST_CARDS.filter((c) => c.processor === selectedProcessor);

  return (
    <ToolLayout
      toolId="test-card"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["api-key", "jwt-secret", "random-string"]}
      securityNotes="These are official test card numbers from Stripe and Braintree documentation. They only work in sandbox environments and will never process real transactions."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            These are <strong>official test card numbers</strong> from processor documentation. Only use them in sandbox/test environments. For all cards, use any future expiry date (e.g., 12/34).
          </p>
        </div>

        {/* Processor selector */}
        <div className="flex gap-2">
          {PROCESSORS.map((proc) => (
            <button
              key={proc}
              type="button"
              onClick={() => setSelectedProcessor(proc)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                selectedProcessor === proc
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent"
              }`}
              aria-pressed={selectedProcessor === proc}
            >
              {proc}
            </button>
          ))}
        </div>

        {/* Card list */}
        <div className="space-y-3">
          {filteredCards.map((card) => (
            <div
              key={`${card.processor}-${card.number}`}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-mono text-sm font-semibold text-foreground tracking-wider">
                      {formatCardNumber(card.number)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><span className="font-medium">Network:</span> {card.network}</span>
                    <span><span className="font-medium">CVV:</span> <span className="font-mono">{card.cvv}</span></span>
                    <span><span className="font-medium">Expiry:</span> <span className="font-mono">{card.expiry}</span></span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </div>
                <CopyButton value={card.number} size="sm" label="Copy" />
              </div>
            </div>
          ))}
        </div>

        {/* PayPal note */}
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">PayPal Sandbox</p>
          <p>Use PayPal developer sandbox accounts at <span className="font-mono text-xs">developer.paypal.com</span>. PayPal sandbox uses email/password credentials rather than card numbers — create personal and business sandbox accounts in the PayPal developer dashboard.</p>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
