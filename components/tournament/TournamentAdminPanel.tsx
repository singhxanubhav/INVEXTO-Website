"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";

export function TournamentAdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  if (authLoading) return null;
  if (!user?.isAdmin) return null;

  const handleClose = async () => {
    setLoading("close");
    try {
      const res = await fetch("/api/tournament/close", { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        toast.success("Tournament closed");
        router.refresh();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to close tournament");
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = async () => {
    setLoading("create");
    try {
      const res = await fetch("/api/tournament/create", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("New tournament created");
        router.refresh();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to create tournament");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-12 rounded-2xl border border-amber-800/20 bg-amber-950/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
          Admin Controls
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleClose}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-red-800/30 bg-red-950/30 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          {loading === "close" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Close Tournament
        </button>
        <button
          onClick={handleCreate}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-800/30 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
        >
          {loading === "create" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Create Tournament
        </button>
      </div>
    </div>
  );
}
