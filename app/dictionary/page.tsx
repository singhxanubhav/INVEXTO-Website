import { BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DictionaryClient } from "@/src/components/dictionary/DictionaryClient";
import { dictionaryTerms } from "@/src/data/dictionary";

export default function DictionaryPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col items-center px-4 pb-24 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.3_0.1_80/0.08)_0%,_transparent_70%)]" />
          <div className="relative z-10 mx-auto w-full max-w-3xl">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/30 bg-emerald-950/30 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-300/70">
                <BookOpen className="h-3 w-3" />
                Reference
              </span>
              <h1 className="mt-4 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                Dictionary
              </h1>
              <p className="mt-2 text-base text-muted-foreground/70">
                Every term you&apos;ll encounter on INVEXTO, explained simply.
              </p>
            </div>
            <DictionaryClient terms={dictionaryTerms} />
            <div className="mt-10 rounded-xl border border-emerald-800/15 bg-emerald-950/20 p-5 text-center">
              <p className="text-sm text-muted-foreground/60">
                Can&apos;t find a term? These are the most common terms on INVEXTO.
                <br />
                More terms will be added over time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
