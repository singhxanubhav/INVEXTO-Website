"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Loader2, Phone, Check, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface Props {
  tournamentId: string;
}

export function RegisterForm({ tournamentId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUserName(json.data.name);
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onFormSubmit = (data: RegisterFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const confirmRegistration = async () => {
    if (!pendingData) return;
    setShowConfirmDialog(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tournament/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: pendingData.phone,
        }),
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
      setPendingData(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-900/30 to-gray-950 p-6">
        <h2 className="mb-1 text-xl font-bold text-white">Register Now</h2>
        <p className="mb-6 text-sm text-gray-500">
          Enter your phone number to join the tournament
        </p>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {userName && (
            <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/20 p-3 text-sm text-gray-300">
              Logged in as <span className="font-semibold text-white">{userName}</span>
            </div>
          )}

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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="border-red-800/40 bg-emerald-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <TriangleAlert className="h-5 w-5" />
              Your portfolio will be wiped
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Joining the tournament will permanently delete all your current
              holdings and reset your cash to ₹1,00,000. This cannot be undone.
              Your transaction history will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingData(null);
              }}
              className="border-emerald-800/30 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRegistration}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Yes, join tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
