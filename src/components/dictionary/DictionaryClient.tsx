"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DictionaryTerm } from "@/src/data/dictionary";

const categories = ["All", "General", "Technical", "Chart", "Derivatives"] as const;

const categoryColors: Record<string, string> = {
  General: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Technical: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Chart: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Derivatives: "bg-orange-500/15 text-orange-300 border-orange-500/30",
};

interface DictionaryClientProps {
  terms: DictionaryTerm[];
}

export function DictionaryClient({ terms }: DictionaryClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const matchesSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || t.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, terms]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search terms or definitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border-emerald-800/25 bg-emerald-900/20 pl-10 text-sm placeholder:text-muted-foreground/40 focus:border-emerald-600/50 focus:ring-emerald-600/20"
          />
        </div>
        <div className="flex gap-1.5 rounded-xl border border-emerald-800/20 bg-emerald-900/10 p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                category === cat
                  ? "bg-amber-500 text-emerald-950 shadow-sm shadow-amber-900/30"
                  : "text-emerald-300/60 hover:text-emerald-300/90"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-emerald-800/20 py-16">
          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">No terms match your search</p>
          <button
            onClick={() => { setSearch(""); setCategory("All"); }}
            className="text-xs text-amber-400/70 hover:text-amber-400"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2.5">
          {filtered.map((term, i) => (
            <AccordionItem
              key={term.term}
              value={`item-${i}`}
              className="group rounded-xl border border-emerald-800/20 bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 px-5 transition-all duration-200 hover:border-emerald-700/30 hover:shadow-sm hover:shadow-emerald-900/10 data-[state=open]:border-emerald-700/30"
            >
              <AccordionTrigger className="py-4 text-sm font-medium text-foreground/90 hover:text-amber-400 no-underline hover:no-underline transition-all [&[data-state=open]>svg]:text-amber-400 [&[data-state=open]]:text-amber-400">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-800/30 text-base transition-transform group-hover:scale-110">
                    {term.emoji}
                  </span>
                  <span>{term.term}</span>
                  <Badge
                    variant="outline"
                    className={`ml-2 text-[10px] px-2 py-0.5 ${categoryColors[term.category] || ""}`}
                  >
                    {term.category}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5 text-sm">
                <p className="leading-relaxed text-muted-foreground/90">
                  {term.definition}
                </p>
                <div className="rounded-xl border border-emerald-800/15 bg-emerald-950/30 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="text-amber-400/70">💡</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">
                      Pro Tip
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground/80">
                    {term.proTip}
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
