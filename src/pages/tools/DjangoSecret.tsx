import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { getRandomInt } from "@/utils/random";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is the Django SECRET_KEY used for?",
    answer:
      "Django uses SECRET_KEY to cryptographically sign cookies, sessions, CSRF tokens, and other security-sensitive values. If an attacker knows your SECRET_KEY, they can forge signed data, bypass CSRF protection, and potentially escalate privileges. It must be kept secret and unique per deployment.",
  },
  {
    question: "How do I apply this key?",
    answer:
      "Set the key in your settings.py file: SECRET_KEY = 'your-key-here'. For production, load it from an environment variable: import os; SECRET_KEY = os.environ['DJANGO_SECRET_KEY']. Never hardcode the production key in source control.",
  },
  {
    question: "When should I rotate my SECRET_KEY?",
    answer:
      "Rotate when: you believe it may be compromised, a team member with access leaves, or you perform a major security audit. Note that rotating invalidates all existing sessions and signed cookies — all users will be logged out. Plan rotation accordingly.",
  },
  {
    question: "What character set does Django use?",
    answer:
      "Django's startproject uses a 50-character key from the set: lowercase letters, digits, and the characters !@#$%^&*(-_=+). This tool uses the same charset to match Django's generated format exactly.",
  },
];

const DJANGO_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)";

function generateDjangoKey(): string {
  let result = "";
  for (let i = 0; i < 50; i++) {
    result += DJANGO_CHARSET[getRandomInt(0, DJANGO_CHARSET.length)];
  }
  return result;
}

export default function DjangoSecretPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [key, setKey] = React.useState<string>(() => generateDjangoKey());

  const handleRegenerate = React.useCallback(() => {
    setKey(generateDjangoKey());
  }, []);

  const formatted = `SECRET_KEY = '${key}'`;
  const envFormat = `DJANGO_SECRET_KEY=${key}`;

  return (
    <ToolLayout
      toolId="django-secret"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["flask-secret", "laravel-app-key", "jwt-secret"]}
      securityNotes="Never commit your SECRET_KEY to version control. Load it from environment variables in production. Treat it like a password — secret and unique per environment."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={formatted}
          onRegenerate={handleRegenerate}
          outputLabel="settings.py"
          filename="django-secret-key"
          exportFormats={["txt"]}
        >
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">.env format</p>
            <div className="rounded-md border bg-muted/60 px-4 py-3 font-mono text-sm text-foreground break-all">
              {envFormat}
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
