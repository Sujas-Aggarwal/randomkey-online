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

export function PrivacyPage(): React.JSX.Element {
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
        title="Privacy Policy"
        description={`${SITE.name} is designed from the ground up to be privacy-first. No data collection, no cookies, no analytics, no third parties.`}
        canonicalPath="/privacy"
      />

      <motion.div
        className="mx-auto max-w-2xl space-y-10 py-4"
        {...fadeIn}
      >
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {SITE.name} is designed from the ground up to be privacy-first. This
            page explains exactly how we handle your data — and what we don't do.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Last updated: May 2026
          </p>
        </header>

        <div className="divide-y divide-border rounded-lg border">
          <div className="p-6 space-y-8">
            <Section id="what-we-collect" title="What we collect">
              <p>
                Nothing. We do not create accounts, collect email addresses, track
                IP addresses, or use analytics software of any kind.
              </p>
              <p>
                There is no registration flow. There is no user profile. There is
                nothing to delete because nothing is recorded.
              </p>
            </Section>

            <Section id="how-generation-works" title="How generation works">
              <p>
                All cryptographic generation — passwords, API keys, JWT secrets,
                UUIDs, SSH keys, and every other tool on this site — happens
                entirely inside your browser.
              </p>
              <p>
                We use the{" "}
                <span className="font-mono text-xs text-foreground">
                  window.crypto.getRandomValues
                </span>{" "}
                API for all entropy, and{" "}
                <span className="font-mono text-xs text-foreground">
                  SubtleCrypto
                </span>{" "}
                for hashing and key derivation. These are browser-native APIs —
                no library needs to phone home and no server is involved.
              </p>
              <p>
                Nothing you generate is sent over the network. Open your browser's
                DevTools Network tab while using any tool and you will see zero
                requests related to generation.
              </p>
            </Section>

            <Section id="local-storage" title="Local storage">
              <p>
                We store two small pieces of data in your browser's{" "}
                <span className="font-mono text-xs text-foreground">localStorage</span>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  <span className="font-medium text-foreground">Theme preference</span>
                  {" "}— light or dark mode.
                </li>
                <li>
                  <span className="font-medium text-foreground">Favorite tools</span>
                  {" "}— the list of tools you have starred for quick access.
                </li>
              </ul>
              <p>
                Generated secrets are{" "}
                <span className="font-medium text-foreground">never stored</span>.
                Close the tab and any generated value is gone. We do not write
                passwords, keys, or any other generated output to localStorage,
                sessionStorage, IndexedDB, or any other persistent store.
              </p>
            </Section>

            <Section id="cookies" title="Cookies">
              <p>
                None. {SITE.name} sets zero cookies. We have nothing to track
                and no third-party services that require cookies.
              </p>
            </Section>

            <Section id="third-parties" title="Third parties">
              <p>
                None. We do not use:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Google Analytics or any analytics platform</li>
                <li>Sentry or any error reporting service</li>
                <li>Google Fonts or any CDN-loaded typefaces</li>
                <li>Advertising networks of any kind</li>
                <li>Social media tracking pixels</li>
                <li>A/B testing tools</li>
              </ul>
              <p>
                All fonts are self-hosted. All JavaScript is bundled and served
                from the same origin. There are no cross-origin requests during
                normal operation.
              </p>
            </Section>

            <Section id="contact" title="Contact">
              <p>
                If you have questions about this policy or want to report a
                security concern, open an issue on GitHub. We do not have a
                support email because we do not collect email addresses.
              </p>
            </Section>
          </div>
        </div>
      </motion.div>
    </>
  );
}
