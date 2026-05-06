import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import nacl from "tweetnacl";
import { ToolLayout } from "@/layouts/ToolLayout";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { OutputBlockSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toBase64 } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What cryptography does WireGuard use?",
    answer:
      "WireGuard uses Curve25519 for key exchange (ECDH), ChaCha20-Poly1305 for symmetric encryption, BLAKE2s for hashing, and SipHash for hashtable keys. The key pair generated here is for the Curve25519 ECDH key exchange — the foundation of WireGuard's cryptographic handshake.",
  },
  {
    question: "How do I use these keys in a WireGuard configuration?",
    answer:
      "In your WireGuard interface config (wg0.conf): set PrivateKey to your private key. In the [Peer] section of the other end's config: set PublicKey to your public key. The other peer does the same — sharing their public key with you, keeping their private key secret.",
  },
  {
    question: "Are these keys compatible with the wg command-line tool?",
    answer:
      "Yes. WireGuard uses standard Curve25519 keys encoded as base64. These keys are generated using the same algorithm (nacl.box.keyPair) and are fully compatible with the wg genkey / wg pubkey commands. You can verify by running: echo '<private-key>' | wg pubkey and comparing with the public key shown.",
  },
  {
    question: "What is the difference between the private and public key?",
    answer:
      "The private key is a secret 32-byte random value — keep it on your device and never share it. The public key is derived from the private key using Curve25519 — it can be shared freely with peers. WireGuard uses a Diffie-Hellman key exchange where both parties use their private key and the other's public key to derive a shared secret.",
  },
];

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

function generateWireguardKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    privateKey: toBase64(keyPair.secretKey),
    publicKey: toBase64(keyPair.publicKey),
  };
}

export default function WireguardKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [keyPair, setKeyPair] = React.useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generate = React.useCallback(() => {
    setIsGenerating(true);
    try {
      setKeyPair(generateWireguardKeyPair());
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ToolLayout
      toolId="wireguard-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["ssh-key", "vapid-key", "encryption-key"]}
      securityNotes="The private key must remain secret — anyone with it can impersonate your WireGuard interface. The public key can be shared with peers."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <section
          aria-label="WireGuard key generator"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          {isGenerating || !keyPair ? (
            <div className="space-y-4">
              <OutputBlockSkeleton />
              <OutputBlockSkeleton />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Private Key</p>
                  <CopyButton value={keyPair.privateKey} size="sm" label="Copy" />
                </div>
                <OutputBlock value={keyPair.privateKey} aria-label="WireGuard private key" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Add to <span className="font-mono">[Interface]</span> as <span className="font-mono">PrivateKey = ...</span>
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Public Key</p>
                  <CopyButton value={keyPair.publicKey} size="sm" label="Copy" />
                </div>
                <OutputBlock value={keyPair.publicKey} aria-label="WireGuard public key" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Share with peers as <span className="font-mono">PublicKey = ...</span> in their <span className="font-mono">[Peer]</span> section
                </p>
              </div>

              <Button variant="outline" onClick={generate} className="gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Regenerate key pair
              </Button>
            </div>
          )}
        </section>
      </motion.div>
    </ToolLayout>
  );
}
