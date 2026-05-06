import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { getRandomBytes } from "@/utils/random";
import { toBase64 } from "@/utils/encoding";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is the Laravel APP_KEY used for?",
    answer:
      "Laravel uses APP_KEY to encrypt cookies, session data, and other encrypted values using AES-256-CBC. The 'base64:' prefix tells Laravel that the key is base64-encoded. Without a valid APP_KEY, encrypted data cannot be decrypted and your application will not function correctly.",
  },
  {
    question: "Is this equivalent to running artisan key:generate?",
    answer:
      "Yes. Laravel's `php artisan key:generate` generates 32 random bytes and base64-encodes them with the 'base64:' prefix — exactly what this tool does. The output is directly usable in your .env file.",
  },
  {
    question: "How do I apply this key?",
    answer:
      "Add it to your .env file: APP_KEY=base64:your-key-here. If you're deploying to a new environment, set it as an environment variable in your hosting platform (Forge, Vapor, Heroku, etc.) rather than committing it to your repository.",
  },
  {
    question: "What happens if I rotate my APP_KEY?",
    answer:
      "All existing encrypted data (cookies, sessions, encrypted model attributes) will become unreadable. Laravel 10+ added a `php artisan key:rotate` command that re-encrypts data using the new key. For older versions, users will be logged out and encrypted data will be lost — plan rotation carefully.",
  },
];

function generateLaravelKey(): string {
  const bytes = getRandomBytes(32);
  return `base64:${toBase64(bytes)}`;
}

export default function LaravelAppKeyPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [key, setKey] = React.useState<string>(() => generateLaravelKey());

  const handleRegenerate = React.useCallback(() => {
    setKey(generateLaravelKey());
  }, []);

  const envFormat = `APP_KEY=${key}`;

  return (
    <ToolLayout
      toolId="laravel-app-key"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["django-secret", "flask-secret", "jwt-secret"]}
      securityNotes="Never commit your APP_KEY to version control. Each environment (development, staging, production) should have its own unique key."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={envFormat}
          onRegenerate={handleRegenerate}
          outputLabel=".env"
          filename="laravel-app-key"
          exportFormats={["txt"]}
        >
          <div>
            <p className="text-xs text-muted-foreground">
              32 bytes (256 bits) of cryptographic randomness, base64-encoded with the <span className="font-mono">base64:</span> prefix required by Laravel.
            </p>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
