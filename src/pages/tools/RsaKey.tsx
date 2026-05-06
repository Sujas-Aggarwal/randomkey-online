import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Why is RSA key generation computationally intensive?",
    answer:
      "RSA key generation requires finding two large prime numbers, which involves probabilistic primality testing and modular arithmetic. For 4096-bit keys, this can take several seconds even on fast hardware. Running this synchronously in the browser's main thread would freeze the UI, which is why Web Worker support is required.",
  },
  {
    question: "When will RSA key generation be available?",
    answer:
      "RSA key generation is planned for Phase 7, where it will run in a dedicated Web Worker to keep the UI responsive. The generated keys will be in standard PEM format (PKCS#8 for private, SPKI for public) compatible with OpenSSL and other tools.",
  },
  {
    question: "What alternatives do I have now?",
    answer:
      "For SSH use cases, the SSH Key Generator supports ECDSA P-256 and P-384, which are smaller, faster, and considered equally secure to RSA-4096 by modern cryptographic standards. For TLS/HTTPS certificates, use ECDSA P-256 keys via your CA's tooling.",
  },
  {
    question: "Is RSA still recommended?",
    answer:
      "RSA remains widely supported and is considered secure at 2048+ bits. However, Elliptic Curve Cryptography (ECC) keys like ECDSA P-256 provide equivalent security with much smaller key sizes and faster operations. New deployments should prefer ECC when the target system supports it.",
  },
];

export default function RsaKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ToolLayout
      toolId="rsa-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["ssh-key", "encryption-key", "aes-key"]}
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <section
          aria-label="RSA key generator coming soon"
          className="rounded-lg border bg-card p-8 shadow-sm text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Coming in Phase 7</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              RSA key generation is computationally intensive and requires a Web Worker to avoid freezing the browser UI.
              It will be available in Phase 7 with full 2048 and 4096-bit support.
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground max-w-md mx-auto">
            <p className="font-medium text-foreground mb-1">In the meantime:</p>
            <p>Use the <a href="/tools/ssh-key" className="text-primary underline underline-offset-2 hover:no-underline">SSH Key Generator</a> for ECDSA P-256/P-384 keys, which provide equivalent security with better performance.</p>
          </div>
        </section>
      </motion.div>
    </ToolLayout>
  );
}
