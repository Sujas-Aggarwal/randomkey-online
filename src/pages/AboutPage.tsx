import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MetaTags } from "@/seo/MetaTags";
import { SITE } from "@/lib/site";

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function Section({ id, title, children }: SectionProps): React.JSX.Element {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2
        id={id}
        className="text-lg font-semibold text-foreground tracking-tight"
      >
        {title}
      </h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

const TECH_STACK = [
  { name: "React 18", note: "UI framework" },
  { name: "TypeScript", note: "strict mode, noUncheckedIndexedAccess" },
  { name: "Vite 5", note: "build tool" },
  { name: "TailwindCSS", note: "styling" },
  { name: "shadcn/ui", note: "accessible component primitives" },
  { name: "Web Cryptography API", note: "all entropy and key derivation" },
  { name: "Zustand", note: "client state (theme, favorites)" },
  { name: "framer-motion", note: "restrained animations" },
  { name: "vite-plugin-pwa", note: "offline support" },
];

const THREAT_MODEL_LIMITATIONS = [
  "Compromised devices — if your OS or hardware is compromised, browser generation cannot be trusted.",
  "Malicious browser extensions — an extension with full page access can read clipboard content or intercept generated values.",
  "Clipboard malware — malware running on your device may monitor or replace clipboard contents before you paste.",
  "Browser vulnerabilities — a zero-day in the browser's crypto implementation could undermine all generation.",
  "Shoulder surfing — anyone watching your screen can see generated secrets.",
  "Screen capture software — recording software running in the background may capture secrets as they appear.",
];

export function AboutPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: "easeOut" },
      };

  return (
    <>
      <MetaTags
        title="About"
        description={`Learn about ${SITE.name} — a browser-native security toolkit for generating passwords, API keys, JWT secrets, and more with no server and no tracking.`}
        canonicalPath="/about"
      />

      <motion.div
        className="mx-auto max-w-2xl space-y-10 py-4"
        {...fadeIn}
      >
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            About {SITE.name}
          </h1>
        </header>

        <div className="divide-y divide-border rounded-lg border">
          <div className="p-6 space-y-8">
            <Section id="what-it-is" title="What it is">
              <p>
                {SITE.name} is a browser-native security toolkit for developers,
                sysadmins, and anyone who needs cryptographically secure secrets.
                It generates passwords, API keys, JWT signing secrets, UUIDs,
                SSH key pairs, encryption keys, and more — all without involving
                a server.
              </p>
              <p>
                The goal is simple: give you a fast, trustworthy tool that does
                exactly what it says and nothing else. No accounts. No data
                collection. No ads. No fluff.
              </p>
            </Section>

            <Section id="why-browser-native" title="Why browser-native">
              <p>
                When a tool generates secrets server-side, there is an inherent
                trust problem: you must trust that the server does not log your
                secrets, that the connection is not intercepted in transit, and
                that the server is not compromised. These are meaningful risks.
              </p>
              <p>
                When generation happens in your browser:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>There is no server to breach.</li>
                <li>There is no transit to intercept — the value never leaves your device.</li>
                <li>There are no logs to steal.</li>
                <li>You can verify the behavior yourself using browser DevTools.</li>
              </ul>
              <p>
                Browser-native generation is not a workaround — it is the correct
                architecture for a privacy-first secret generation tool.
              </p>
            </Section>

            <Section id="threat-model" title="Threat model and limitations">
              <p>
                Browser-side generation is strong, but it is not a complete security
                guarantee. The following threats are{" "}
                <span className="font-medium text-foreground">not</span> mitigated
                by this tool:
              </p>
              <ul className="space-y-2 pt-1">
                {THREAT_MODEL_LIMITATIONS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 font-mono text-xs text-primary mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Use {SITE.name} on a device you trust, in a browser profile without
                untrusted extensions, and copy secrets directly into your password
                manager or configuration without leaving them on your clipboard
                longer than necessary.
              </p>
            </Section>

            <Section id="tech-stack" title="Tech stack">
              <p>
                {SITE.name} uses only well-maintained, auditable open-source
                libraries. Fonts are self-hosted. There are no CDN runtime
                dependencies.
              </p>
              <div className="mt-2 rounded-md border overflow-hidden">
                {TECH_STACK.map(({ name, note }, i) => (
                  <div
                    key={name}
                    className={`flex items-baseline justify-between gap-4 px-4 py-2.5 text-xs ${
                      i < TECH_STACK.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <span className="font-mono font-medium text-foreground">{name}</span>
                    <span className="text-muted-foreground text-right">{note}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="cryptography" title="Cryptography">
              <p>
                All random values are generated using{" "}
                <span className="font-mono text-xs text-foreground">
                  window.crypto.getRandomValues
                </span>
                , which draws from the operating system's cryptographically secure
                pseudorandom number generator (CSPRNG). This is the same source
                used by{" "}
                <span className="font-mono text-xs text-foreground">openssl rand</span>,{" "}
                <span className="font-mono text-xs text-foreground">/dev/urandom</span>,
                and every serious security tool.
              </p>
              <p>
                Hashing and key derivation use{" "}
                <span className="font-mono text-xs text-foreground">SubtleCrypto</span>{" "}
                — the browser's native implementation of SHA-256, SHA-384, SHA-512,
                PBKDF2, and HKDF. These are FIPS 140-compliant algorithms implemented
                by the browser vendor, not by this codebase.
              </p>
              <p>
                <span className="font-mono text-xs text-foreground">Math.random()</span>
                {" "}is never used for any security-sensitive operation. It is not
                seeded with entropy from the operating system and is not suitable for
                cryptographic use.
              </p>
            </Section>
          </div>
        </div>
      </motion.div>
    </>
  );
}
