"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { glossaryTerms } from "@/src/data/glossary";

const categories = ["All", "Fundamentals", "Trading", "Market Events"] as const;

export function GlossaryAccordion() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return glossaryTerms.filter((t) => {
      const matchesSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || t.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search glossary terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-emerald-900/30 pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat
                ? "bg-amber-500 text-emerald-950"
                : "bg-emerald-800/30 text-emerald-300/80 hover:bg-emerald-800/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No terms match your search
        </p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((term, i) => (
            <AccordionItem
              key={term.term}
              value={`item-${i}`}
              className="rounded-lg border border-emerald-800/30 bg-emerald-900/20 px-4"
            >
              <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:text-amber-400 transition-colors no-underline hover:no-underline [&[data-state=open]>svg]:text-amber-400">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{term.emoji}</span>
                  {term.term}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  {term.definition}
                </p>
                <div className="rounded-lg border border-emerald-800/20 bg-emerald-900/30 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                    How to use
                  </span>
                  <p className="mt-1 text-muted-foreground/90 leading-relaxed">
                    {term.howToUse}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
