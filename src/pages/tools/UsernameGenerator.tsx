import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ToolLayout } from "@/layouts/ToolLayout";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { randomChoice, getRandomInt } from "@/utils/random";
import type { FAQItem } from "@/components/FAQSection";

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Why use a generated username instead of my real name?",
    answer:
      "A randomly generated username protects your privacy by not revealing personal information. On platforms where anonymity matters — forums, public repositories, gaming — a username unlinked to your identity prevents cross-platform tracking, social engineering, and OSINT attacks.",
  },
  {
    question: "How do I choose a good username?",
    answer:
      "Choose something memorable enough to recall but not personally identifiable. Generated usernames combine words to create unique combinations. You can regenerate until you find one you like. Avoid usernames that include your real name, birth year, location, or other identifying information.",
  },
  {
    question: "Are generated usernames truly unique?",
    answer:
      "With over 50 adjectives, 50 nouns, and numeric suffixes, the combination space is large enough that collisions are unlikely in practice. However, we cannot guarantee uniqueness on any specific platform — always check availability after generation.",
  },
  {
    question: "Can I use these for account registration?",
    answer:
      "Yes. These are suitable for any platform that accepts alphanumeric usernames. Some platforms may reject dots or hyphens — use the 'None' separator option in that case. For platforms with strict length limits, choose a shorter combination.",
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

const COLORS = [
  "red","blue","green","gold","silver","black","white","grey","amber","jade",
  "coral","indigo","violet","teal","azure","crimson","cobalt","ebony","ivory","scarlet",
];

const ANIMALS = [
  "fox","wolf","bear","hawk","lynx","raven","tiger","eagle","viper","shark",
  "falcon","dragon","phoenix","panther","cobra","jaguar","osprey","coyote","badger","marmot",
];

const VERBS = [
  "runs","flies","leaps","dives","roams","seeks","scans","builds","codes","thinks",
  "hacks","vaults","drifts","glides","hunts","traces","forges","crafts","scripts","wires",
];

type Style = "adj-noun" | "adj-noun-num" | "random";
type Separator = "none" | "underscore" | "dot" | "hyphen";
type Count = 1 | 3 | 5;

const STYLE_OPTIONS = [
  { value: "adj-noun" as Style, label: "Adj+Noun" },
  { value: "adj-noun-num" as Style, label: "Adj+Noun+Num" },
  { value: "random" as Style, label: "Random" },
] as const;

const SEP_OPTIONS = [
  { value: "none" as Separator, label: "None" },
  { value: "underscore" as Separator, label: "_" },
  { value: "dot" as Separator, label: "." },
  { value: "hyphen" as Separator, label: "-" },
] as const;

const COUNT_OPTIONS = [
  { value: 1 as Count, label: "1" },
  { value: 3 as Count, label: "3" },
  { value: 5 as Count, label: "5" },
] as const;

function applyCase(s: string, capitalize: boolean): string {
  return capitalize ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function generateUsername(style: Style, sep: Separator): string {
  const s = sep === "none" ? "" : sep === "underscore" ? "_" : sep === "dot" ? "." : "-";
  const capitalize = sep === "none"; // CamelCase when no separator

  switch (style) {
    case "adj-noun": {
      const adj = randomChoice(ADJECTIVES);
      const noun = randomChoice(NOUNS);
      return `${applyCase(adj, capitalize)}${s}${applyCase(noun, capitalize)}`;
    }
    case "adj-noun-num": {
      const adj = randomChoice(ADJECTIVES);
      const noun = randomChoice(NOUNS);
      const num = getRandomInt(10, 1000);
      return `${applyCase(adj, capitalize)}${s}${applyCase(noun, capitalize)}${s}${num}`;
    }
    case "random": {
      const patterns = ["color-animal", "noun-verb", "adj-noun-num"] as const;
      const pattern = randomChoice(patterns);
      if (pattern === "color-animal") {
        const color = randomChoice(COLORS);
        const animal = randomChoice(ANIMALS);
        const num = getRandomInt(10, 100);
        return `${applyCase(color, capitalize)}${s}${applyCase(animal, capitalize)}${num}`;
      } else if (pattern === "noun-verb") {
        const noun = randomChoice(NOUNS);
        const verb = randomChoice(VERBS);
        return `${applyCase(noun, capitalize)}${s}${applyCase(verb, capitalize)}`;
      } else {
        const adj = randomChoice(ADJECTIVES);
        const noun = randomChoice(NOUNS);
        const num = getRandomInt(10, 1000);
        return `${applyCase(adj, capitalize)}${s}${applyCase(noun, capitalize)}${num}`;
      }
    }
  }
}

function generateUsernames(count: Count, style: Style, sep: Separator): string[] {
  return Array.from({ length: count }, () => generateUsername(style, sep));
}

export default function UsernameGeneratorPage(): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const [style, setStyle] = React.useState<Style>("adj-noun");
  const [separator, setSeparator] = React.useState<Separator>("none");
  const [count, setCount] = React.useState<Count>(1);
  const [output, setOutput] = React.useState<string[]>(() => generateUsernames(1, "adj-noun", "none"));

  React.useEffect(() => {
    setOutput(generateUsernames(count, style, separator));
  }, [count, style, separator]);

  const handleRegenerate = React.useCallback(() => {
    setOutput(generateUsernames(count, style, separator));
  }, [count, style, separator]);

  return (
    <ToolLayout
      toolId="username-generator"
      faqItems={FAQ_ITEMS}
      relatedToolIds={["password", "passphrase", "random-string"]}
      securityNotes="Generated usernames use cryptographic randomness for selection. They do not reveal personal information by design."
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GeneratorPanel
          output={output}
          onRegenerate={handleRegenerate}
          multiline={count > 1}
          filename="usernames"
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Style</p>
              <SegmentedControl
                options={STYLE_OPTIONS}
                value={style}
                onChange={(v) => setStyle(v)}
                aria-label="Username style"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Separator</p>
              <SegmentedControl
                options={SEP_OPTIONS}
                value={separator}
                onChange={(v) => setSeparator(v)}
                aria-label="Word separator"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Count</p>
              <SegmentedControl
                options={COUNT_OPTIONS}
                value={count}
                onChange={(v) => setCount(v)}
                aria-label="Number of usernames"
              />
            </div>
          </div>
        </GeneratorPanel>
      </motion.div>
    </ToolLayout>
  );
}
