"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Loader2, User, Phone, Mail, Check } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email: z.string().email("Valid email is required"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface Props {
  tournamentId: string;
}

export function RegisterForm({ tournamentId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/tournament/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#f59e0b", "#ffffff"],
        });
        toast.success("You're in! Good luck 🎉");
        router.refresh();
      } else {
        toast.error(json.error || "Registration failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/30 to-gray-950 p-6">
      <h2 className="mb-1 text-xl font-bold text-white">Register Now</h2>
      <p className="mb-6 text-sm text-gray-500">
        Enter your details to join the tournament
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              {...register("name")}
              placeholder="Your full name"
              className="w-full rounded-xl border border-emerald-800/25 bg-emerald-950/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              {...register("phone")}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full rounded-xl border border-emerald-800/25 bg-emerald-950/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              {...register("email")}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-emerald-800/25 bg-emerald-950/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3">
          <input
            type="checkbox"
            {...register("terms")}
            className="mt-0.5 size-4 rounded border-emerald-700/50 bg-emerald-900/30 text-amber-500 focus:ring-amber-500/30"
          />
          <span className="text-xs leading-relaxed text-gray-500">
            I understand prizes are paid via UPI ID on file. Simulate Events
            are disabled during the tournament.
          </span>
        </label>
        {errors.terms && (
          <p className="text-xs text-red-400">{errors.terms.message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {submitting ? "Registering..." : "Join Tournament"}
        </button>
      </form>
    </div>
  );
}
