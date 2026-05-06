import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { randomChoice, getRandomInt } from "@/utils/random";
import { estimateBits } from "@/utils/entropy";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Are memorable passwords secure?",
    answer:
      "Memorable passwords drawn from small word lists have significantly lower entropy than fully random passwords. They are suitable for low-stakes use cases where you need to memorize a credential briefly, but should not be used for email, banking, or other high-value accounts. For those, use a passphrase or a randomly generated password stored in a password manager.",
  },
  {
    question: "What is the entropy of a memorable password?",
    answer:
      "With a 50-word list, 2 digits, and 1 symbol, a Word+Number+Symbol password has roughly 30–40 bits of entropy — adequate for casual use but far below the 80+ bits recommended for important accounts. The EntropyMeter above shows the estimated strength.",
  },
  {
    question: "When should I use this over a passphrase?",
    answer:
      "Memorable passwords are shorter and quicker to type than passphrases. Use them for temporary credentials, device PINs you need to speak aloud, or any situation where brief memorability matters more than maximum entropy. For sustained security, a diceware passphrase with 5–6 words is a much better choice.",
  },
  {
    question: "Can I improve the security of these passwords?",
    answer:
      "Yes — choose the Word+Word+Number pattern (two words gives a larger space), use a longer digit sequence, or combine with a symbol. But the best improvement is switching to a passphrase generator or a full random password stored in a password manager.",
  },
];

const ADJECTIVES = [
  "swift","brave","calm","dark","eager","fair","glad","huge","icy","jolly",
  "keen","lazy","merry","neat","odd","pale","quick","rare","safe","tall",
  "urban","vast","warm","young","zany","bold","crisp","dull","epic","firm",
  "gold","hot","iron","jade","kind","loud","mild","nice","open","pink",
  "quiet","red","slim","tidy","unique","vivid","wild","extra","amber","blue",
];
const NOUNS = [
  "apple","beard","cloud","door","eagle","flame","globe","horse","igloo","jewel",
  "knife","lemon","maple","night","ocean","piano","queen","river","stone","tiger",
  "umbra","viper","whale","xenon","yacht","zebra","arrow","brick","cedar","delta",
  "ember","fjord","grove","haven","inlet","jumbo","kelp","lance","manor","nexus",
  "orbit","prism","quest","ridge","sigma","tower","ultra","valve","wave","xray",
];
const SYMBOLS = ["!", "@", "#", "$", "%", "&", "*", "?"];

type Pattern = "word-number-symbol" | "word-word-number" | "adj-noun-number";

function generateMemorablePassword(pattern: Pattern): string {
  switch (pattern) {
    case "word-number-symbol": {
      const word = randomChoice(ADJECTIVES);
      const num = getRandomInt(10, 100);
      const sym = randomChoice(SYMBOLS);
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      return `${capitalized}${num}${sym}`;
    }
    case "word-word-number": {
      const adj = randomChoice(ADJECTIVES);
      const noun = randomChoice(NOUNS);
      const num = getRandomInt(10, 100);
      return `${adj.charAt(0).toUpperCase() + adj.slice(1)}${noun.charAt(0).toUpperCase() + noun.slice(1)}${num}`;
    }
    case "adj-noun-number": {
      const adj = randomChoice(ADJECTIVES);
      const noun = randomChoice(NOUNS);
      const num = getRandomInt(100, 1000);
      return `${adj}-${noun}-${num}`;
    }
  }
}

const PATTERN_OPTIONS = [
  { value: "word-number-symbol" as Pattern, label: "Word+Num+Symbol" },
  { value: "word-word-number" as Pattern, label: "Word+Word+Num" },
  { value: "adj-noun-number" as Pattern, label: "Adj-Noun-Num" },
] as const;

const COUNT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 3, label: "3" },
  { value: 5, label: "5" },
] as const;

type Count = 1 | 3 | 5;

export default function MemorablePasswordPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [pattern, setPattern] = React.useState<Pattern>("word-number-symbol");
  const [count, setCount] = React.useState<Count>(1);
  const [output, setOutput] = React.useState<string[]>(() => [generateMemorablePassword("word-number-symbol")]);

  React.useEffect(() => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(generateMemorablePassword(pattern));
    }
    setOutput(results);
  }, [pattern, count]);

  const handleRegenerate = React.useCallback(() => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(generateMemorablePassword(pattern));
    }
    setOutput(results);
  }, [pattern, count]);

  // Rough entropy estimate
  const entropyBits = estimateBits(50, 1) + estimateBits(10, 2) + estimateBits(8, 1);

  return (
    <ToolLayout
      toolId="memorable-password"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["passphrase", "password", "master-password"]}
      securityNotes="Memorable passwords have LOW entropy (~30–40 bits). They are NOT suitable for high-security accounts like email, banking, or password managers. Use a passphrase or random password for those."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          showEntropy
          entropyBits={entropyBits}
          filename="memorable-password"
          multiline={count > 1}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Pattern</p>
              <SegmentedControl
                options={PATTERN_OPTIONS}
                value={pattern}
                onChange={(v) => setPattern(v)}
                aria-label="Password pattern"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of passwords"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
