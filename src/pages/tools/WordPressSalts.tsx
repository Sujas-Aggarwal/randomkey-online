import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { getRandomInt } from "@/utils/random";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are WordPress security keys and salts?",
    answer:
      "WordPress uses eight cryptographic keys and salts to improve the security of cookie encryption and nonce generation. They make it harder to crack passwords in cookies and password reset links. Each key should be unique, random, and at least 60 characters long.",
  },
  {
    question: "When should I regenerate WordPress salts?",
    answer:
      "Regenerate salts when: your site has been compromised, you suspect unauthorized access, you change hosting providers, or as part of a regular security audit. Regenerating salts forces all users to log in again — their existing sessions will be invalidated.",
  },
  {
    question: "How do I apply the generated salts?",
    answer:
      "Replace the existing salt definitions in your wp-config.php file with the generated define() statements. If you can't find existing definitions, add them anywhere in wp-config.php, ideally after the database configuration section.",
  },
  {
    question: "Can I use the WordPress.org salt generator instead?",
    answer:
      "Yes — api.wordpress.org/secret-key/1.1/salt/ generates salts on a remote server. However, this tool generates them entirely in your browser using the Web Cryptography API, so the salts never leave your device. Both approaches produce equally random salts.",
  },
];

// WordPress charset — matches their official generator
const WP_CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_ []{}<>~`+=,.;:/?|";

const WP_SALT_KEYS = [
  "AUTH_KEY",
  "SECURE_AUTH_KEY",
  "LOGGED_IN_KEY",
  "NONCE_KEY",
  "AUTH_SALT",
  "SECURE_AUTH_SALT",
  "LOGGED_IN_SALT",
  "NONCE_SALT",
] as const;

function generateWPSalt(): string {
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += WP_CHARSET[getRandomInt(0, WP_CHARSET.length)];
  }
  return result;
}

function generateAllSalts(): string {
  return WP_SALT_KEYS.map(
    (key) => `define('${key}', '${generateWPSalt()}');`
  ).join("\n");
}

export default function WordPressSaltsPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [output, setOutput] = React.useState<string>(() => generateAllSalts());

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateAllSalts());
  }, []);

  return (
    <ToolLayout
      toolId="wordpress-salts"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["django-secret", "flask-secret", "laravel-app-key"]}
      securityNotes="Replace these values in your wp-config.php file. Regenerating salts will log out all users immediately."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          outputLabel="wp-config.php"
          multiline
          filename="wordpress-salts"
          exportFormats={["txt"]}
        >
          <p className="text-xs text-muted-foreground">
            8 keys × 64 random characters each, from the WordPress charset. Copy the entire block and replace the existing definitions in your wp-config.php.
          </p>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
