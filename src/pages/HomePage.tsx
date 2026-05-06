import { Link } from "react-router-dom";
import { Shield, Zap, Lock, ArrowRight } from "lucide-react";
import { MetaTags } from "@/seo/MetaTags";
import { getToolsGroupedByCategory } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function HomePage(): React.JSX.Element {
  const groups = getToolsGroupedByCategory();

  return (
    <>
      <MetaTags canonicalPath="/" />

      <div className="mx-auto max-w-5xl space-y-16">
        {/* Hero */}
        <section className="py-12 text-center" aria-labelledby="hero-heading">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden="true" />
            100% browser-native — nothing leaves your device
          </div>
          <h1
            id="hero-heading"
            className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {SITE.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Privacy-first browser-native{" "}
            <strong className="text-foreground">secret and key generator</strong>.
            Generate passwords, API keys, JWT secrets, SSH keys, UUIDs, and more —
            entirely in your browser using the Web Crypto API.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/tools/password">
                Generate a Password
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/tools/api-key">API Key Generator</Link>
            </Button>
          </div>
        </section>

        {/* Trust badges */}
        <section aria-labelledby="trust-heading" className="sr-only">
          <h2 id="trust-heading">Why {SITE.name}?</h2>
        </section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Zero Network Egress",
              body: "All generation uses window.crypto.getRandomValues and SubtleCrypto. Nothing is ever sent to a server.",
            },
            {
              icon: Zap,
              title: "Instant Generation",
              body: "Browser-native crypto is extremely fast. Keys appear in milliseconds with no server round-trips.",
            },
            {
              icon: Lock,
              title: "No Tracking",
              body: "No analytics, no telemetry, no cookies, no fingerprinting. Just a tool that does one thing well.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border bg-card p-5"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border bg-background">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {/* Tools by category */}
        <section aria-labelledby="tools-heading">
          <h2
            id="tools-heading"
            className="mb-6 text-2xl font-bold tracking-tight text-foreground"
          >
            All Tools
          </h2>
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.category}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/tools/${tool.slug}`}
                      className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background group-hover:border-primary/50 transition-colors">
                          <span className="text-xs font-mono text-primary">
                            {tool.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm leading-tight">
                          {tool.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEO-friendly FAQ */}
        <section aria-labelledby="faq-heading" className="pb-8">
          <h2
            id="faq-heading"
            className="mb-6 text-2xl font-bold tracking-tight text-foreground"
          >
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {[
              {
                q: "Is this a random key generator?",
                a: `Yes. ${SITE.name} is a browser-native random key generator that uses window.crypto.getRandomValues for all entropy. This is the same source your operating system uses for cryptographic keys.`,
              },
              {
                q: "Are my generated secrets safe?",
                a: "All generation happens entirely in your browser. No data is sent to any server, logged, or stored by default. We have no backend and no way to see what you generate.",
              },
              {
                q: "Can I use this as a WiFi password generator?",
                a: "Yes. The WiFi password generator creates strong, memorable passwords optimized for network credentials, balancing security with ease of entry on mobile devices.",
              },
              {
                q: "What is a secret key generator?",
                a: "A secret key generator creates cryptographically random strings used to authenticate applications, sign tokens, encrypt data, and identify sessions. Our secret key generator supports multiple formats and lengths.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-lg border bg-card p-5">
                <dt className="font-semibold text-foreground">{q}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
