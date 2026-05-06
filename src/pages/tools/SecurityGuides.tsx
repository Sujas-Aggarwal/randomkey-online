import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ToolLayout } from "@/layouts/ToolLayout";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Where can I learn more about cryptography?",
    answer:
      "Recommended resources: 'Cryptography Engineering' by Ferguson, Schneier, and Kohno; 'Applied Cryptography' by Bruce Schneier; the NIST Special Publications (SP 800-series); the Crypto101 free book at crypto101.io; and the Stanford Cryptography courses on Coursera.",
  },
  {
    question: "Is browser-based cryptography trustworthy?",
    answer:
      "Yes, for key generation and non-sensitive operations. The Web Cryptography API (SubtleCrypto) uses the same cryptographic primitives as native applications. The main risks are: malicious browser extensions intercepting clipboard operations, compromised JavaScript bundles, and insecure transmission of generated secrets.",
  },
  {
    question: "What is the difference between hashing and encryption?",
    answer:
      "Hashing is a one-way transformation: you cannot recover the original input from a hash. It's used for integrity verification and password storage. Encryption is reversible: with the correct key, you can decrypt the ciphertext back to plaintext. Use hashing for passwords, encryption for data you need to retrieve.",
  },
  {
    question: "What should I do if my passwords are leaked in a breach?",
    answer:
      "Change the leaked password immediately on all services where you reused it. Enable MFA on all important accounts. Check haveibeenpwned.com to see which of your accounts are known to be breached. This is why password uniqueness matters — a single breach shouldn't compromise multiple accounts.",
  },
];

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "password-best-practices",
    title: "Password Best Practices",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          A strong password is randomly generated, at least 16 characters long, and unique to each account. The most important factor is length — a 20-character password is exponentially harder to crack than a 10-character one, regardless of character variety.
        </p>
        <p>
          Use a password manager. Tools like Bitwarden, 1Password, and KeePass generate and store unique passwords for every site, so you only need to remember one master password. This eliminates password reuse — the single most common cause of account compromises after breaches.
        </p>
        <p>
          Never use personal information (names, dates, pet names, addresses) in passwords. Attackers use this information in targeted dictionary attacks. Avoid keyboard patterns (qwerty, 12345) and common words. If you must create a memorable password, use a diceware passphrase of 5–6 random words.
        </p>
        <p>
          Enable multi-factor authentication (MFA) on every account that supports it. A strong password combined with TOTP 2FA protects against most remote attacks, even if the password is eventually compromised.
        </p>
      </div>
    ),
  },
  {
    id: "understanding-entropy",
    title: "Understanding Entropy",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Entropy in cryptography measures unpredictability, expressed in bits. A password with N bits of entropy requires an attacker to try up to 2^N possibilities in the worst case. Each additional bit doubles the search space.
        </p>
        <p>
          For a password drawn uniformly from a pool of C characters with length L, entropy = L × log₂(C). A 16-character password using all 94 printable ASCII characters has 16 × log₂(94) ≈ 104 bits of entropy.
        </p>
        <p>
          NIST recommends at least 80 bits of entropy for most applications. Passwords with 120+ bits are considered "very strong" and would take longer than the age of the universe to crack even with a trillion guesses per second.
        </p>
        <p>
          Entropy assumes the password was randomly generated. A human-chosen password that looks complex ("P@ssw0rd!") may have high theoretical entropy but near-zero real entropy if it's a predictable pattern. Always use randomly generated passwords.
        </p>
      </div>
    ),
  },
  {
    id: "key-types",
    title: "Key Types Explained",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Symmetric keys</strong> use the same key for both encryption and decryption. AES is the standard: AES-256 uses a 256-bit key and is required for top-secret government data. Symmetric encryption is fast and suitable for bulk data encryption. The challenge is securely sharing the key.
        </p>
        <p>
          <strong className="text-foreground">Asymmetric keys</strong> come in pairs: a public key (safe to share) and a private key (kept secret). RSA and ECDSA are common examples. Anyone can encrypt data with your public key; only you can decrypt it with your private key. Used for key exchange, digital signatures, and TLS.
        </p>
        <p>
          <strong className="text-foreground">HMAC keys</strong> are symmetric keys used for message authentication. An HMAC tag proves that a message came from someone with the key and hasn't been tampered with. Used in API authentication, JWT signing, and webhook verification.
        </p>
        <p>
          <strong className="text-foreground">Derived keys</strong> are generated from a password or master key using a key derivation function (KDF) like PBKDF2, bcrypt, or Argon2. KDFs are deliberately slow to make brute-force attacks expensive. Always use a KDF when storing passwords — never store plaintext or simply SHA-256 hashed passwords.
        </p>
      </div>
    ),
  },
  {
    id: "2fa-guide",
    title: "2FA / MFA Guide",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Multi-factor authentication (MFA) requires a second proof of identity in addition to your password. The factors are: something you know (password), something you have (phone, hardware key), and something you are (biometrics). Any two of these together is called 2FA.
        </p>
        <p>
          <strong className="text-foreground">TOTP (Authenticator apps)</strong> — Best choice for most people. Apps like Google Authenticator and Authy generate time-based 6-digit codes. Codes are generated locally and never transmitted over the phone network, making them immune to SIM-swapping attacks.
        </p>
        <p>
          <strong className="text-foreground">SMS 2FA</strong> — Better than nothing, but not recommended. SMS is vulnerable to SIM-swapping (convincing your carrier to transfer your number to an attacker's SIM) and SS7 protocol attacks. Use TOTP or a hardware key whenever possible.
        </p>
        <p>
          <strong className="text-foreground">Hardware keys (YubiKey, passkeys)</strong> — The most phishing-resistant option. Hardware keys use public-key cryptography; even if you're phished into entering your credentials on a fake site, the hardware key won't authenticate because the domain doesn't match. Passkeys (WebAuthn) bring similar protection to software.
        </p>
      </div>
    ),
  },
  {
    id: "key-storage",
    title: "Secure Key Storage",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>
          Environment variables are the minimum standard for storing secrets in applications. Load them from a .env file locally; inject them as environment variables in CI/CD and production. Add .env to your .gitignore — never commit secrets to version control.
        </p>
        <p>
          For production systems, use a dedicated secrets manager: AWS Secrets Manager, Google Cloud Secret Manager, Azure Key Vault, or HashiCorp Vault. These provide access control, audit logging, automatic rotation, and encryption at rest. Applications retrieve secrets at runtime rather than storing them in configuration files.
        </p>
        <p>
          Rotate secrets regularly and after any suspected compromise. Implement secret rotation automation where possible — most cloud secrets managers support automatic rotation with Lambda functions or similar mechanisms.
        </p>
        <p>
          Scan your codebase regularly with tools like truffleHog, git-secrets, or GitHub's built-in secret scanning. These detect accidentally committed API keys, passwords, and tokens. Enable branch protection rules to prevent direct commits to main branches where accidental secrets are most likely to persist.
        </p>
      </div>
    ),
  },
];

function AccordionItem({ section }: { section: GuideSection }): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const contentId = `guide-${section.id}-content`;
  const headingId = `guide-${section.id}-heading`;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-1 py-4 text-left",
          "text-sm font-semibold text-foreground",
          "hover:text-primary transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
        )}
      >
        <span>{section.title}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headingId}
        hidden={!open}
      >
        <div className="pb-4 px-1">{section.content}</div>
      </div>
    </div>
  );
}

export default function SecurityGuidesPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ToolLayout
      toolId="security-guides"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["hash-generator", "totp-2fa", "pgp-gpg"]}
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <section
          aria-label="Security guides"
          className="rounded-lg border bg-card shadow-sm divide-y"
        >
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.id} className="px-5 sm:px-6">
              <AccordionItem section={section} />
            </div>
          ))}
        </section>
      </motion.div>
    </ToolLayout>
  );
}
