"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { LoginForm } from "@/components/home/LoginForm";
import { useAuth } from "@/src/hooks/useAuth";
import { apiPost } from "@/src/lib/api";
import type { LoginData } from "@/lib/schemas/auth";
import type { User } from "@/src/types";

function LoginContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/stocks";
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push(redirect);
    return null;
  }

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    const res = await apiPost<User>("/api/auth/login", {
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (res.success) {
      window.location.href = redirect;
    } else {
      toast.error(res.error || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.7_0.15_80/0.12)_0%,_transparent_60%)]" />
        <div className="absolute -bottom-20 -right-20 size-80 rounded-full bg-emerald-800/20 blur-3xl" />
        <div className="absolute -top-20 -left-20 size-60 rounded-full bg-amber-500/10 blur-3xl" />

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
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Learn to invest
            <br />
            <span className="text-amber-400">before you invest</span>
            <br />
            real money.
          </h1>
          <div className="mt-8 space-y-4">
            {[
              "Trade virtual stocks with ₹1,00,000 simulated cash",
              "Replay historic market crashes & rallies",
              "Compete in monthly tournaments & win prizes",
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
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-gray-950 via-gray-950 to-emerald-950/30 px-4 sm:px-6 lg:w-1/2">
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
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-1.5 text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm onLogin={handleLogin} loading={loading} />

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Create one
              <ArrowRight className="ml-0.5 inline-block size-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
