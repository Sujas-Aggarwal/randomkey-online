import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Star, Clock, Shield, Wifi, Globe, HardDrive } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { MetaTags } from "@/seo/MetaTags";
import { FAQSection } from "@/components/FAQSection";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { getToolsGroupedByCategory, TOOLS } from "@/data/tools";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types/tool";

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url("/"),
  description: SITE.description,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with Web Cryptography API support",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Password Generator",
    "API Key Generator",
    "JWT Secret Generator",
    "UUID Generator",
    "SSH Key Generator",
    "WiFi Password Generator",
    "Browser-native cryptography",
    "No server communication",
    "Offline support",
  ],
};

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

interface TrustBadge {
  icon: IconComponent;
  label: string;
}

const TRUST_BADGES: TrustBadge[] = [
  { icon: Shield, label: "Browser-native" },
  { icon: Globe, label: "No server" },
  { icon: HardDrive, label: "Works offline" },
  { icon: Wifi, label: "Zero network requests" },
];

const STATS = [
  { value: "40+", label: "tools" },
  { value: "256-bit", label: "entropy" },
  { value: "Zero", label: "network requests" },
  { value: "Web Crypto API", label: "standard" },
];

// Build FAQ items using SITE.name to avoid hardcoded domain strings
function buildFaqItems() {
  const siteName = SITE.name;
  return [
    {
      question: `Is ${siteName} safe to use?`,
      answer:
        "Yes. All generation happens entirely in your browser using the Web Cryptography API (window.crypto.getRandomValues and SubtleCrypto). No secret, key, or password you generate ever leaves your device. There is no backend server, no analytics, and no network requests during generation.",
    },
    {
      question: "Does this work offline?",
      answer: `Yes. ${siteName} is a Progressive Web App (PWA) that caches its assets on first load. After your initial visit, all tools work fully offline with no internet connection required.`,
    },
    {
      question: "Are my passwords or keys stored anywhere?",
      answer:
        "Generated secrets are never stored automatically. Your theme preference and favorite tools are saved to localStorage, but no generated passwords, keys, or secrets are persisted. Close the tab and they are gone.",
    },
    {
      question: "What browsers are supported?",
      answer:
        "The latest two versions of Chrome, Edge, Firefox, and Safari are fully supported. All modern browsers ship the Web Cryptography API, which is the only dependency for cryptographic operations.",
    },
    {
      question: "What cryptography is used?",
      answer:
        "All entropy comes from window.crypto.getRandomValues — the same source your operating system uses for cryptographic keys. Key derivation and hashing use SubtleCrypto (SHA-256, SHA-384, SHA-512). Math.random() is never used for any security-sensitive operation.",
    },
    {
      question: "Is the source code auditable?",
      answer: `Yes. ${siteName} is open source. You can review every cryptographic operation, confirm that no network requests are made during generation, and verify that no secrets are transmitted.`,
    },
  ];
}

const FAQ_ITEMS = buildFaqItems();

interface ToolCardProps {
  tool: Tool;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

function ToolCard({ tool, isFavorite, onToggleFavorite }: ToolCardProps): React.JSX.Element {
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void navigate(`/tools/${tool.slug}`);
    }
  };

  return (
    <div role="article" className="group relative">
      <Link
        to={`/tools/${tool.slug}`}
        className={cn(
          "flex items-start gap-3 rounded-lg border bg-card p-4",
          "transition-all duration-150",
          "hover:border-primary/40 hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        onKeyDown={handleKeyDown}
        aria-label={`${tool.name}: ${tool.description}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight text-foreground group-hover:text-primary transition-colors">
            {tool.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </div>
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </Link>

      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={
          isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`
        }
        aria-pressed={isFavorite}
        className={cn(
          "absolute top-3 right-3 p-1 rounded transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isFavorite
            ? "text-amber-400 opacity-100"
            : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100"
        )}
      >
        <Star
          className="h-3.5 w-3.5"
          fill={isFavorite ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function HomePage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const groups = getToolsGroupedByCategory();
  const { favorites, recentTools, toggleFavorite } = useUserStore();

  const recentToolsList = recentTools
    .slice(0, 6)
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => t !== undefined);

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
        title="Secure Key &amp; Password Generator"
        description="Generate passwords, API keys, JWT secrets, UUIDs, SSH keys, and more — entirely in your browser. No server. No tracking. Privacy-first."
        keywords={[
          "key generator",
          "random key generator",
          "password generator",
          "secret generator",
          "wifi password generator",
          "api key generator",
        ]}
        canonicalPath="/"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
      </Helmet>

      <motion.div className="mx-auto max-w-5xl space-y-16" {...fadeIn}>
        {/* Hero */}
        <section className="pt-10 pb-4 text-center" aria-labelledby="hero-heading">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            Generate secure keys,{" "}
            <span className="text-primary">passwords</span>, and secrets
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground leading-relaxed">
            Everything runs in your browser using the{" "}
            <span className="font-mono text-sm text-foreground">Web Crypto API</span>. No server
            receives your secrets. No analytics. No tracking.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/tools/password">
                Generate a Password
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#tools">Browse All Tools</a>
            </Button>
          </div>

          {/* Trust badges */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            aria-label="Trust indicators"
          >
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Stats bar */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          aria-label="At a glance"
        >
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <span>
                <span className="font-mono font-semibold text-foreground">{stat.value}</span>{" "}
                {stat.label}
              </span>
              {i < STATS.length - 1 && (
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Tool grid */}
        <section id="tools" aria-labelledby="tools-heading">
          <h2
            id="tools-heading"
            className="mb-6 text-2xl font-bold tracking-tight text-foreground"
          >
            All Tools
          </h2>

          {/* Recent tools row */}
          {recentToolsList.length > 0 && (
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recently Used
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {recentToolsList.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isFavorite={favorites.includes(tool.id)}
                    onToggleFavorite={(e) => {
                      e.preventDefault();
                      toggleFavorite(tool.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All categories */}
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.category}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={favorites.includes(tool.id)}
                      onToggleFavorite={(e) => {
                        e.preventDefault();
                        toggleFavorite(tool.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="homepage-faq-heading" className="pb-8">
          <h2
            id="homepage-faq-heading"
            className="mb-6 text-2xl font-bold tracking-tight text-foreground"
          >
            Frequently Asked Questions
          </h2>
          <FAQSection items={FAQ_ITEMS} />
        </section>
      </motion.div>
    </>
  );
}
