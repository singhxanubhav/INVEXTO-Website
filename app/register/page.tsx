"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ArrowRight, Check, Sparkles, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { RegisterForm } from "@/components/home/RegisterForm";
import { useAuth } from "@/src/hooks/useAuth";
import type { RegisterData } from "@/lib/schemas/auth";

export default function RegisterPage() {
  const { register, verifyOtp } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    const res = await register(data);
    setLoading(false);
    if (!res.success) {
      toast.error(res.error || "Registration failed");
    } else {
      toast.success("OTP sent to your email");
      setRegisteredEmail(data.email);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredEmail || !otp) return;

    setLoading(true);
    const res = await verifyOtp(registeredEmail, otp);
    setLoading(false);
    
    if (!res.success) {
      toast.error(res.error || "Invalid OTP");
    } else {
      toast.success("Account verified successfully!");
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
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-gray-950 via-gray-950 to-emerald-950/30 px-6 lg:w-1/2">
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

          {!registeredEmail ? (
            <>
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
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8 text-center lg:text-left">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-emerald-900/30">
                  <Mail className="size-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Check your email
                </h2>
                <p className="mt-1.5 text-gray-400">
                  We've sent a 6-digit verification code to <span className="font-medium text-white">{registeredEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="flex h-11 w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-center text-2xl tracking-[0.5em] text-white placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-base font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify Account"
                  )}
                </button>
              </form>

              <button
                onClick={() => setRegisteredEmail(null)}
                className="mt-6 w-full text-center text-sm font-medium text-gray-500 transition hover:text-gray-400"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
