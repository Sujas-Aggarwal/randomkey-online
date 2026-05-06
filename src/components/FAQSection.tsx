import * as React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  items: FAQItem[];
  className?: string;
}

interface FAQItemRowProps {
  item: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItemRow({ item, index, isOpen, onToggle }: FAQItemRowProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const headingId = `faq-heading-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div className="border-b last:border-b-0">
      <h3>
        <button
          id={headingId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={cn(
            "flex w-full items-center justify-between gap-4",
            "px-4 py-4 text-left text-sm font-medium text-foreground",
            "hover:text-primary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "focus-visible:ring-offset-background rounded-sm"
          )}
        >
          <span>{item.question}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            key="content"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-5 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Accessible FAQ accordion with JSON-LD schema injection.
 * All items start closed; each can be individually toggled.
 */
export function FAQSection({ items, className }: FAQSectionProps): React.JSX.Element {
  const [openIndices, setOpenIndices] = React.useState<Set<number>>(new Set());

  const toggle = React.useCallback((index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Build JSON-LD FAQ schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section
        aria-labelledby="faq-section-heading"
        className={cn("w-full", className)}
      >
        <h2
          id="faq-section-heading"
          className="mb-4 text-lg font-semibold tracking-tight text-foreground"
        >
          Frequently Asked Questions
        </h2>

        <div className="rounded-lg border divide-y divide-border">
          {items.map((item, i) => (
            <FAQItemRow
              key={i}
              item={item}
              index={i}
              isOpen={openIndices.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
