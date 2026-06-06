"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { FeatureCards } from "@/components/home/FeatureCards";
import { AppGuide } from "@/components/home/AppGuide";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <FeatureCards />

        <section className="w-full px-4 pb-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
              How INVEXTO works
            </h2>
            <AppGuide />
          </div>
        </section>

        <section className="w-full px-4 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base text-muted-foreground/80">
              New to investing terms? Visit our{" "}
              <Link
                href="/dictionary"
                className="font-semibold text-amber-400 underline underline-offset-4 transition-colors hover:text-amber-300"
              >
                Dictionary
              </Link>{" "}
              ←
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
