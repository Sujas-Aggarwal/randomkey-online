import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { OutputBlockSkeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What format are the generated keys in?",
    answer:
      "The private key is exported as PKCS#8 PEM (standard for private keys), and the public key is exported as SPKI PEM format. These are standard formats supported by most cryptographic tools. Note that OpenSSH uses its own format — to convert to OpenSSH format, use: ssh-keygen -y -f private.pem > public.pub or openssl pkey tools.",
  },
  {
    question: "ECDSA vs RSA — which should I use for SSH?",
    answer:
      "ECDSA (P-256 or P-384) keys are shorter, faster to verify, and considered highly secure. RSA keys are older and more universally compatible. For modern systems (OpenSSH 6.5+), ECDSA is recommended. For maximum compatibility with older systems, RSA-4096 remains a valid choice (available in Phase 7 with Web Worker support).",
  },
  {
    question: "How do I add the public key to a server?",
    answer:
      "Save the private key to ~/.ssh/id_ecdsa and the public key to ~/.ssh/id_ecdsa.pub. Then on the target server, append the public key to ~/.ssh/authorized_keys. Alternatively, use ssh-copy-id to automate this. Set correct permissions: chmod 600 ~/.ssh/id_ecdsa.",
  },
  {
    question: "Should I add a passphrase to the private key?",
    answer:
      "Yes — always protect private keys with a strong passphrase. A passphrase encrypts the private key file on disk, so even if the file is stolen, the attacker cannot use it without the passphrase. Use ssh-agent to avoid typing the passphrase repeatedly during a session.",
  },
];

type KeyType = "ecdsa-p256" | "ecdsa-p384";

const KEY_TYPE_OPTIONS = [
  { value: "ecdsa-p256" as KeyType, label: "ECDSA P-256" },
  { value: "ecdsa-p384" as KeyType, label: "ECDSA P-384" },
] as const;

function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

async function generateSSHKeyPair(keyType: KeyType): Promise<{ privateKey: string; publicKey: string }> {
  const curve = keyType === "ecdsa-p256" ? "P-256" : "P-384";

  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: curve },
    true,
    ["sign", "verify"]
  );

  const [privateKeyBuffer, publicKeyBuffer] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    crypto.subtle.exportKey("spki", keyPair.publicKey),
  ]);

  return {
    privateKey: arrayBufferToPem(privateKeyBuffer, "PRIVATE KEY"),
    publicKey: arrayBufferToPem(publicKeyBuffer, "PUBLIC KEY"),
  };
}

export default function SshKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [keyType, setKeyType] = React.useState<KeyType>("ecdsa-p256");
  const [privateKey, setPrivateKey] = React.useState("");
  const [publicKey, setPublicKey] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generate = React.useCallback(async (type: KeyType) => {
    setIsGenerating(true);
    try {
      const { privateKey: priv, publicKey: pub } = await generateSSHKeyPair(type);
      setPrivateKey(priv);
      setPublicKey(pub);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    void generate(keyType);
  }, [keyType, generate]);

  const handleRegenerate = React.useCallback(() => {
    void generate(keyType);
  }, [keyType, generate]);

  return (
    <ToolLayout
      toolId="ssh-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["pgp-gpg", "wireguard-key", "encryption-key"]}
      securityNotes="The private key is sensitive — never share it. Store it with permissions 600. The public key can be freely shared. Note: These are PKCS#8/SPKI PEM keys; for OpenSSH format, convert using ssh-keygen."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <section
          aria-label="SSH key generator"
          className="rounded-lg border bg-card p-5 shadow-sm space-y-5 sm:p-6"
        >
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Key type</p>
            <SegmentedControl
              options={KEY_TYPE_OPTIONS}
              value={keyType}
              onChange={(v) => setKeyType(v)}
              aria-label="Key type"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              RSA key generation requires a Web Worker and is available in Phase 7.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <GeneratorPanel
              output={privateKey}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
              filename="ssh-private-key"
              exportFormats={["txt"]}
              className="hidden"
            >
              {null}
            </GeneratorPanel>
          </div>

          {isGenerating ? (
            <div className="space-y-4">
              <OutputBlockSkeleton />
              <OutputBlockSkeleton />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Private Key (PKCS#8)</p>
                  <CopyButton value={privateKey} size="sm" label="Copy private" />
                </div>
                <OutputBlock value={privateKey} multiline aria-label="SSH private key" />
                <p className="mt-1 text-xs text-muted-foreground">Keep this secret. Set file permissions to 600.</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Public Key (SPKI)</p>
                  <CopyButton value={publicKey} size="sm" label="Copy public" />
                </div>
                <OutputBlock value={publicKey} multiline aria-label="SSH public key" />
                <p className="mt-1 text-xs text-muted-foreground">Add this to ~/.ssh/authorized_keys on your server.</p>
              </div>

              <button
                type="button"
                onClick={handleRegenerate}
                className="rounded-md border px-4 py-2 text-sm font-medium transition-colors border-border bg-background text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Regenerate key pair
              </button>
            </div>
          )}
        </section>
      </motion.div>
    </ToolLayout>
  );
}
