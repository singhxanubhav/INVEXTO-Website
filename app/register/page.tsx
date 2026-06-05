"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ArrowRight, Check, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { RegisterForm } from "@/components/home/RegisterForm";
import { useAuth } from "@/src/hooks/useAuth";
import type { RegisterData } from "@/lib/schemas/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    const res = await register(data);
    setLoading(false);
    if (!res.success) {
      toast.error(res.error || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.7_0.15_80/0.12)_0%,_transparent_60%)]" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-emerald-800/20 blur-3xl" />
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500">
              <TrendingUp className="size-5 text-emerald-950" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              INVEXTO
            </span>
          </Link>
        </div>

        <div className="relative z-10 -mt-20">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-900/30 px-3 py-1 text-xs text-emerald-300">
            <Sparkles className="size-3" />
            Start your investing journey today
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Your first step toward
            <br />
            <span className="text-amber-400">financial confidence</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Practice with virtual money. Build real skills.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "No real money required — 100% risk-free",
              "Learn at your own pace with market simulations",
              "Compete, track progress, and level up",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/40">
                  <Check className="size-3.5 text-emerald-400" />
                </div>
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          &copy; 2026 INVEXTO. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex w-full items-center justify-center bg-gradient-to-br from-gray-950 via-gray-950 to-emerald-950/30 px-6 lg:w-1/2">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500">
              <TrendingUp className="size-5 text-emerald-950" />
            </div>
            <span className="text-xl font-bold text-white">INVEXTO</span>
          </Link>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white">
              Create your account
            </h2>
            <p className="mt-1.5 text-gray-400">
              Start your risk-free investing journey
            </p>
          </div>

          <RegisterForm onRegister={handleRegister} loading={loading} />

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Sign in
              <ArrowRight className="ml-0.5 inline-block size-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
